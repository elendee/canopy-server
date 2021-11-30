const lib = require('../lib.js')
const log = require('../log.js')
const DB = require('../db.js')
const Persistent = require('./Persistent.js')
const Tile = require('./Tile.js')


class Canopy extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'canopies'
		this.name = lib.validate_string( init.name, 'unnamed canopy' )
		this.type = lib.validate_string( init.type, 'generic' )
		this.description = lib.validate_string( init.description, 'not much is known about this canopy')
		this.radius = lib.validate_number( init.radius, 100 )
		this._seed = lib.validate_string( init._seed, init.seed, undefined )

		// instantiated
		this._tiles = []
		this._bloomed = init._bloomed
	}

	async init(){

		// run seed, hydrate default Tiles
		if( !this._bloomed ) await this.bloom()

		// apply user mods to Tiles
		await this.apply_mods()

		return { success: true }

	}


	async bloom( seed ){

		log('flag', 'bloom')

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

		log('flag', 'apply mods')

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

		log('flag', 'get_tile')

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