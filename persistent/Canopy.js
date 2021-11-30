const lib = require('../utilities/lib.js')
const log = require('../utilities/log.js')
const DB = require('./db.js')
const Persistent = require('./Persistent.js')
const Tile = require('./Tile.js')
const Being = require('./Being.js')
const uuid = require('uuid').v4


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

		// instantiated
		this._intervals = {
			spawn_npc: false,
			growth: false,
		}
		this._NPCS = {}
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
				const missing = canopy._npc_count - Object.keys( canopy._NPCS ).length
				if( typeof missing !== 'number' || missing <= 0 ) return
				for( let i = 0; i < missing; i++ ){
					const npc = canopy.spawn_npc()
					if( !npc ) log('flag', 'failed to init: ', npc )
				}
			}, 10 * 1000 )
		}
		if( !canopy._intervals.growth ){
			canopy._intervals.growth = setInterval(() => {
				
			}, 10 * 1000 )
		}

		CANOPIES[ canopy.uuid ] = this

		return true

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


	spawn_npc(){
		const npc = new Being({
			_type: 'npc',
		})

		if( this.place_npc( npc ) ){
			this._NPCS[ npc.uuid ] = npc
			npc.step()
			return npc
		}

		return false
	
	}


	place_npc( npc ){
		let cell
		for( let x = 0; x < this._tiles.length; x++ ){
			for( let y = 0; y < this._tiles[x].length; y++ ){
				cell = this._tiles[x][y]
				if( cell.in_biome() && cell.is_empty() ){
					npc.x = x
					npc.y = y
					return true
				}
			}
		}
		return false
	}


	close(){
		for( const type in this._intervals ){
			clearInterval( this._intervals[ type ] )
			this._intervals[ type ] = false
		}
		for( const uuid in this._NPCS ){
			this._NPCS[ uuid ].remove()
		}	

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