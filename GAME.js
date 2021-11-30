const log = require('./utilities/log.js')
const lib = require('./utilities/lib.js')
const Canopy = require('./persistent/Canopy.js')
const User = require('./persistent/User.js')
const DB = require('./persistent/db.js')

const BROKER = require('./utilities/EventBroker.js')





const USERS = {}
const CANOPIES = {}

const init_user = async( socket ) => {

	let u = socket.request.session.USER
	const user = new User( u )
	if( !user ) return lib.return_fail( 'no user rejected', 'no user found' )
	log('init_user', lib.identify( user ) )

	// get canopy
	let canopy
	if( !user._canopy_key ){
		canopy = await get_canopy('any')
		if( !canopy ) return lib.return_fail( 'no canopies', 'no canopy found')

		user._canopy_key = canopy.id
		if( user._id ) await user.save()

		log('init_user', lib.identify( user ) + ' entered canopy' )

	}

	canopy = new Canopy( canopy )
	await canopy.bring_online( CANOPIES )

	const c = canopy.publish(['_seed'])

	log('init_user', lib.identify( user ) + ' entering canopy: ', c )

	return {
		success: true,
		canopy: c,
	}

}



const get_canopy = async( identifier ) => {

	const pool = DB.getPool()
	let sql, res 
	if( typeof identifier === 'number' ){
		sql = 'SELECT * FROM canopies WHERE id=?'
		res = await pool.queryPromise( sql, identifier )
	}else if( identifier === 'any' ){
		sql = 'SELECT * FROM canopies LIMIT 1'
		res = await pool.queryPromise( sql )
	}
	if( res.error ) return lib.return_fail( res.error, 'faild to get canopy')
	return res.results[0]

}


module.exports = {
	init_user,
}