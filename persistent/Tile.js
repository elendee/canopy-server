
const lib = require('../utilities/lib.js')
const log = require('../utilities/log.js')
const DB = require('./db.js')
const Persistent = require('./Persistent.js')

class Tile extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		init.type = init.type
		this._table = 'tiles'
	}


	apply_mod( mod ){

		log('flag', 'applying mod: ', mod )	

	}


	in_biome(){

		return this !== 'EMPTY'
		
	}


	async save(){

		const update_fields = [
			'type',
		]

		const update_vals = [ 
			this.type,
		]

		log('Tile', 'saving tile: ', this )

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}

module.exports = Tile