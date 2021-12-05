// const env = require('./.env.js')
const lib = require('../utilities/lib.js')
const log = require('../utilities/log.js')
const DB = require('./db.js')
const uuid = require('uuid').v4
const {
	Vector3,
	Vector2,
} = require('three')
const GLOBAL = require('../GLOBAL_PUBLIC.js')
const Persistent = require('./Persistent.js')

// const { coilmail } = require('../mail.js')


module.exports = class User extends Persistent {
	
	constructor( init ){

		super( init )

		init = init || {}

		this._table = 'users'

		this.uuid = init.uuid || uuid()

		// const last_vis = init.last_visited || init._last_visited

		this._email = lib.validate_string( init.email, undefined )

		this._password = lib.validate_string( init._password, init.password, undefined )

		this.handle = lib.validate_string( init.handle, 'guest#' + uuid().substr(0, 6) )

		this._reset_hash = lib.validate_string( init.reset_hash, init._reset_hash, undefined )

		this._confirmed = lib.validate_number( init._confirmed, init.confirmed, 0 )

		this._confirm_sent = lib.validate_number( init._confirm_sent, init.confirm_sent, 0 )

		// const conf_date = init.confirm_date || init._confirm_date

		this._confirm_key = lib.validate_string( init._confirm_key, init.confirm_key, undefined )

		this._canopy_key = lib.validate_number( init._canopy_key, init.canopy_key, undefined )

		this._custom_string = lib.validate_string( init._custom_string, init.custom_string, '' )


		// instantaited

		this._canopy_uuid = lib.validate_string( init._canopy_uuid, undefined )

		this._ref = {
			position: new Vector3(),
			facing: new Vector2(),
		}

		this.logistic = this.logistic || []
		if( Array.isArray( init.logistic )){
			for( const key of init.logistic ){
				if( !this.logistic.includes( key ) )  push( key )
			}
		}

		this.custom_data = this.blob_unpack()

	}



	blob_unpack(){
		const user = this
		let data
		try{
			data = JSON.parse( user._custom_string )
		}catch( err ){
			log('flag', 'invalid player data', user._custom_string ? err : '(player has no custom string)')
			data = { invalid: Date.now() }
		}
		return data
	}


	blob_update( packet ){
		log('flag', 'user update: ', packet )
		const { type, data } = packet
		const { blob } = data
		if( typeof blob === 'object'){
			this.custom_data = blob
			delete this.custom_data.invalid
			this.blob_stringify()
		}
	}



	blob_stringify(){
		const user = this
		try{
			user._custom_string = JSON.stringify( user.custom_data )
		}catch(err){
			log('flag', 'blob_stringify err: ', err )
			user._custom_string = JSON.stringify({ invalid: Date.now() })
		}
	}



	async update_visited( column, req ){

		const user = this

		log('gatekeep', 'update_visited: (' + column + ')', req.path, '...' + user._email.substr( 3 ) )

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

		this.blob_stringify()

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
			'custom_string',
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
			this._custom_string,
		]

		log('User', 'saving user: ', this )
		// log('User', 'saving update_vals: ', update_vals )

		const res = await DB.update( this, update_fields, update_vals )

		return res

	}
	


}









