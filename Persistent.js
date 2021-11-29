const log = require('./log.js')

const lib = require('./lib.js')

// const uuid = require('uuid').v4

module.exports = class Persistent {

	constructor( init ){

		init = init || {}

		this._id = lib.validate_number( init._id, init.id, undefined )

		this._table = init._table

		this._created = lib.validate_stamp( init.created, init._created, 0 )

		this._edited = lib.validate_stamp( init.edited, init._edited, 0 )

		this.logistic = []
		this.logistic.push('logistic', 'xyzzy', '_table', '_id', '_created', '_edited')
		for( const key of ( init.logistic || [] ) ){
			if( !this.logistic.includes( key ) )  this.logistic.push( key )
		}

	}


	publish( excepted_array ){

		excepted_array = Array.isArray( excepted_array ) ? excepted_array : []

		let r = {}

		for( const key of Object.keys( this )){

			if( key && typeof key === 'string' && ( key[0] !== '_' || excepted_array.includes( key ) ) ){
				if( this[ key ] && this[ key ].publish && typeof( this[ key ].publish ) === 'function' ){
					r[ key ] = this[ key ].publish()
				}else{
					r[ key ] = this[ key ]
				}
			}

		}

		return r

	}

}
