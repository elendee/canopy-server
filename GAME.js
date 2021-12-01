const log = require('./utilities/log.js')
const lib = require('./utilities/lib.js')
const Canopy = require('./persistent/Canopy.js')
const User = require('./persistent/User.js')
const DB = require('./persistent/db.js')

const BROKER = require('./utilities/EventBroker.js')
const ROUTER = require('./utilities/ROUTER.js')
const SOCKETS = require('./SOCKETS.js')





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

	ROUTER.bind_user( socket, CANOPIES )

	SOCKETS[ user.uuid ] = socket

	canopy.join_user( user )

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






const purge = ( socket, uuid ) => {
	// packet abusers

	socket = socket || SOCKETS[ uuid ]

	if( !socket || !socket.request || !socket.request.session || !socket.request.session.USER ){
		log('flag', 'invalid socket purge' )
		return false
	}

	// log('flag', 'purging with coin: ', socket.request.session.USER._PILOT._coin )

	let user = socket.request.session.USER

	// const party = PARTIES.get_party( pilot.uuid )
	// if( party ) party.remove_member( pilot.uuid )

	for( const can_uuid in CANOPIES ){
		for( const uuid in CANOPIES[ can_uuid ]._PLAYERS ){
			if( uuid ===  user.uuid ){
				CANOPIES[ can_uuid ].remove_entity( uuid )
			}
		}
	}

	delete SOCKETS[ user.uuid ]

	// clearTimeout( pilot._loop_objective )
	// delete pilot._loop_objective
	// if( pilot._SHIP ){
	// 	clearTimeout( pilot._SHIP._move_pulse )
	// 	delete pilot._SHIP._move_pulse			
	// }

	// socket.request.session.last_purge = Date.now()
	// socket.request.session.USER._last_purge = Date.now()
	// socket.request.session.save( err => {
	// 	if( err ){
	// 		log('flag', 'session save err', err )
	// 	}else{
	// 		log('debug', 'done save')
	// 	}
	// })

	// objects are now stringified after save:

	socket.terminate()

	log('wss', 'purged user (uuid):', user.uuid )

}



const broadcast = packet => {

}



BROKER.subscribe('GAME_PURGE', purge )
BROKER.subscribe('BROADCAST', broadcast )




module.exports = {
	init_user,
}