// const env = require('./.env.js')
const lib = require('../utilities/lib.js')
const log = require('../utilities/log.js')
const DB = require('./db.js')

const GLOBAL = require('../GLOBAL_PUBLIC.js')

const Persistent = require('./Persistent.js')

// const { coilmail } = require('../mail.js')

const uuid = require('uuid').v4

module.exports = class User extends Persistent {
	
	constructor( init ){

		super( init )

		init = init || {}

		this._table = 'users'

		const last_vis = init.last_visited || init._last_visited

		this.email = lib.validate_string( init.email, undefined )

		this._password = lib.validate_string( init._password, init.password, undefined )

		this.handle = lib.validate_string( init.handle, undefined )

		this._reset_hash = lib.validate_string( init.reset_hash, init._reset_hash, undefined )

		this._confirmed = lib.validate_number( init._confirmed, init.confirmed, 0 )

		this._confirm_sent = lib.validate_number( init._confirm_sent, init.confirm_sent, 0 )

		const conf_date = init.confirm_date || init._confirm_date

		this._confirm_key = lib.validate_string( init._confirm_key, init.confirm_key, undefined )

		this._canopy_key = lib.validate_number( init._canopy_key, init.canopy_key, undefined )

		this.logistic = this.logistic || []
		if( Array.isArray( init.logistic )){
			for( const key of init.logistic ){
				if( !this.logistic.includes( key ) )  push( key )
			}
		}

	}



	async update_visited( column, req ){

		const user = this

		log('gatekeep', 'update_visited: (' + column + ')', req.path, '...' + user.email.substr( 3 ) )

		const pool = DB.getPool()

		if( column === 'last_visited' ){

			const stammmp = new Date().getTime()

			const sql = 'UPDATE users SET last_visited=? WHERE id=?'
			const res = await pool.queryPromise( sql, [ stammmp, user._id ])
			if( res.error )  log('flag', 'error updating last_visited', res.error )

		}else{

			log('flag', 'unknown update_visited column', column )

		}

	}

	


	async save(){

		// log('User', 'saving from user: ', this )

		const update_fields = [
			'id',
			'email',
			'handle',
			'password',
			'confirmed',
			'confirm_key',
			'confirm_sent',
			'last_visited',
			'canopy_key',
		]

		const update_vals = [ 
			this._id,
			this.email,
			this.handle,
			this._password,
			this._confirmed,
			this._confirm_key,
			this._confirm_sent,
			this._last_visited,
			this._canopy_key,
		]

		log('User', 'saving user: ', this )
		// log('User', 'saving update_vals: ', update_vals )

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}
	


}









