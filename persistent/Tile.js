
const lib = require('../lib.js')
const log = require('../log.js')
const DB = require('../db.js')
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