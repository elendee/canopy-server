const env = require('../.env.js')
const lib = require('../utilities/lib.js')
const log = require('../utilities/log.js')
const DB = require('./db.js')
const Persistent = require('./Persistent.js')
const Tile = require('./Tile.js')
const Being = require('./Being.js')
const Npc = require('./Npc.js')
const uuid = require('uuid').v4
const SOCKETS = require('../SOCKETS.js')








class Canopy extends Persistent {

	constructor( init ){

		super( init )
		init = init || {}
		this._table = 'canopies'
		this.uuid = init.uuid || uuid()
		this.name = lib.validate_string( init.name, 'unnamed canopy' )
		this.type = lib.validate_string( init.type, 'generic' )
		this.description = lib.validate_string( init.description, 'not much is known about this canopy')
		this.radius = lib.validate_number( init.radius, 100 )
		this._seed = lib.validate_string( init._seed, init.seed, undefined )
		this._max_npcs = lib.validate_number( init._max_npcs, init.max_npcs, 2 )

		// instantiated
		this._intervals = {
			spawn_npc: false,
			growth: false,
		}
		this._NPCS = {}
		this._PLAYERS = {}
		this._tiles = []
		this._bloomed = init._bloomed

	}


	async bring_online( CANOPIES ){

		const canopy = this

		// run seed, hydrate DEFAULT Tiles
		await canopy.bloom()

		// apply user MODS to Tiles
		await canopy.apply_mods()

		// begin pulses
		if( !canopy._intervals.spawn_npc ){
			canopy._intervals.spawn_npc = setInterval(() => {
				canopy.spawn_npcs()
			}, ( env.LOCAL ? 2 : 10 ) * 1000 )
		}
		if( !canopy._intervals.growth ){
			canopy._intervals.growth = setInterval(() => {
				canopy.grow()
			}, ( env.LOCAL ? 5 : 30 ) * 1000 )
		}

		CANOPIES[ canopy.uuid ] = this

		return true

	}


	remove_user( uuid ){
		const user = this._PLAYERS[ uuid ]
		if( user ){
			if( user._canopy_uuid === this.uuid ) delete user._canopy_uuid
			delete this._PLAYERS[ uuid ]
		}
	}


	join_user( user ){

		this._PLAYERS[ user.uuid ] = user
		user._canopy_uuid = this.uuid

	}


	// 
	async bloom( seed ){

		log('Canopy', 'bloom')

		// one time seed
		if( !this._seed ){
			this._seed = uuid()
			await this.save()
		}

		// add seeding here...
		for( let x = 0; x < this.radius; x++ ){
			this._tiles[x] = []
			for( let y = 0; y < this.radius; y++ ){
				const tile = new Tile()
				this._tiles[x][y] = tile
			}
		}

		this._bloomed = true

		return true

	}


	async apply_mods(){

		log('Canopy', 'apply mods')

		const pool = DB.getPool()
		const sql = 'SELECT * FROM tile_mods WHERE canopy_key=?'
		const res = await pool.queryPromise( sql, this._id )
		if( res.error ) return lib.return_fail( res.error, 'failed to init mods')
		for( const mod of res.results ){
			const tile = this.get_tile( mod.x, mod.y )
			if( !tile ) continue
			tile.apply_mod( mod )
		}

	}


	get_tile( tilex, tiley ){

		log('Canopy', 'get_tile')

		let tile
		for( let x = 0; x < this._tiles.length; x++ ){
			if( tilex !== x  ) continue
			for( let y = 0; y < this._tiles.length; y++ ){
				if( tiley === y ){
					tile = this._tiles[x][y]
					break;
				}
			}
		}
		return tile
	}


	grow(){
		this.broadcast( this.getSockets(), {
			type: 'grow',
			growth: 'some new tile data...'
		})
	}


	spawn_npcs(){
		const canopy = this
		// shims....
		const missing = canopy._max_npcs - Object.keys( canopy._NPCS ).length
		if( typeof missing !== 'number' ) return
		for( let i = 0; i < missing; i++ ){
			if( Math.random() > .8 ){ // shims....
				const npc = canopy.spawn_npc()
				if( !npc ) log('flag', 'failed to init: ', npc )
			}
		}
	}


	spawn_npc(){

		const npc = new Npc()

		if( this.place_npc( npc ) ){
			this._NPCS[ npc.uuid ] = npc
			npc.step( this )
			return npc
		}
		return false
	
	}


	place_npc( npc ){

		let tile
		for( let x = 0; x < this._tiles.length; x++ ){
			for( let y = 0; y < this._tiles[x].length; y++ ){
				tile = this._tiles[x][y]
				if( tile.in_biome() && tile.is_empty() ){
					npc.x = x
					npc.y = y
					return true
				}
			}
		}
		return false

	}


	getSockets(){
		const canopy = this
		const keys = Object.keys( canopy._PLAYERS )
		const s = {}
		for( const uuid in SOCKETS ){
			if( keys.includes( uuid ) ){
				s[ uuid ] = SOCKETS[ uuid ]
			}
		}
		return s
	}


	getPlayers( position, range ){
		const p = {}
		if( position && range ){
			let player
			for( const uuid in this._PLAYERS ){
				player = this._PLAYERS[ uuid ]
				if( player._ref.position.distanceTo( position ) < range ){
					p[ uuid ] = player
				}
			}
		}else{
			for( const uuid in this._PLAYERS ){
				p[ uuid ] = this._PLAYERS[ uuid ]
			}
		}
		return p
	}


	getPlayer( data ){

		const { uuid, field, value } = data 

		if( !uuid && ( !field || !value ) ) return undefined

		if( uuid ){
			for( const p_uuid in this._PLAYERS ){
				if( uuid === p_uuid ) return this._PLAYERS[ p_uuid ]
			}
		}else{ // field / value
			for( const p_uuid in this._PLAYERS ){
				if( this._PLAYERS[ p_uuid ][ field ] === value ){
					return this._PLAYERS[ p_uuid ]
				}
			}
		}
		return undefined
	}


	broadcast( sockets, packet ){

		packet.ts = Date.now()

		if( ['chat'].includes( packet.type ) ) log('broadcast', packet )

		const bundle = JSON.stringify( packet )
		for( const uuid in sockets ){
			sockets[ uuid ].send( bundle )
		}
	}


	close( CANOPIES ){

		if( !CANOPIES ){
			log('flag', 'Canopy needs register CANOPIES to close')
		}

		const canopy = this

		canopy._deleted = true

		const sockets = this.getSockets

		for( const type in canopy._intervals ){
			clearInterval( canopy._intervals[ type ] )
			canopy._intervals[ type ] = false
		}

		for( const uuid in sockets ){ // should never do canopy with players, but just in case

			sockets[ uuid ].send( JSON.stringify({
				type: 'hal', 
				subtype: 'error',
				msg: 'canopy closed',
			}))

			BROKER.publish('GAME_PURGE', {
				socket: sockets[ uuid ],
				uuid: uuid, // optional / backup
			})

		}

		for( const uuid in canopy._NPCS ){
			canopy._NPCS[ uuid ].unset( canopy )
		}	

		delete CANOPIES[ canopy.uuid ]

		return true

	}


	async save(){

		const update_fields = [
			'name',
			'type',
			'description',
			'radius',
			'seed',
		]

		const update_vals = [ 
			this.name,
			this.type,
			this.description,
			this.radius,
			this._seed,
		]

		log('Canopy', 'saving canopy: ', this )

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}


module.exports = Canopy