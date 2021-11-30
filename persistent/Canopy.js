const lib = require('../lib.js')
const DB = require('../db.js')
const Persistent = require('./Persistent.js')


class Canopy extends Persistent {

	constructor( init ){
		super( init )
		init = init || {}
		this._table = 'canopies'
		this.name = lib.validate_string( init.name, 'unnamed canopy' )
		this.description = lib.validate_string( init.description, 'not much is known about this canopy')
		this.radius = lib.validate_number( init.radius, 100 )
	}


	async save(){

		const update_fields = [
			'name',
			'description',
			'radius',
		]

		const update_vals = [ 
			this.name,
			this.description,
			this.radius,
		]

		log('Canopy', 'saving canopy: ', this )

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}

}


module.exports = Canopy