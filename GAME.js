
const env = require('./.env.js')
const log = require('./utilities/log.js')
const lib = require('./utilities/lib.js')
const Canopy = require('./persistent/Canopy.js')
const User = require('./persistent/User.js')
const DB = require('./persistent/db.js')

const BROKER = require('./utilities/EventBroker.js')
const ROUTER = require('./utilities/ROUTER.js')
const SOCKETS = require('./SOCKETS.js')
const CHAT = require('./CHAT.js')




const CANOPIES = {}



const _intervals = {
	streetsweeper: false,
}



const streetsweeper = () => {

	if( !_intervals.streetsweeper ){

		_intervals.streetsweeper = setInterval(() => {

			for( const uuid in CANOPIES ){
				log('streetsweeper', 'canopy: ', uuid.substr(0, 4), Object.keys( CANOPIES[ uuid ]._PLAYERS ).length + ' players' )
				if( !Object.keys( CANOPIES[ uuid ]._PLAYERS ).length ){
					CANOPIES[ uuid ].close( CANOPIES )
				}
			}

			if( !Object.keys( CANOPIES ).length ){
				for( const key in _intervals ){
					clearInterval( _intervals[ key ] )
					_intervals[ key ] = false					
				}
				log('streetsweeper', 'CLOSING' )
				log('boot', 'no canopies online; GAME going dormant')
			}

		}, env.LOCAL ? 3 * 1000 : 30 * 1000  )
	}

}



const init_user = async( socket ) => {

	streetsweeper()

	let u = socket.request.session.USER
	let user
	socket.request.session.USER = user = new User( u )
	if( !user ) return lib.return_fail( 'no user rejected', 'no user found' )
	log('init_user', 'attempt:', lib.identify( user ) )

	// get canopy
	let canopy
	if( !user._canopy_key ){
		canopy = await touch_canopy('any')
		if( !canopy ) return lib.return_fail( 'no canopies', 'no canopy found')

		user._canopy_key = canopy._id
		if( user._id ) await user.save()

		log('init_user', 'entered:', lib.identify( user ) )

	}

	ROUTER.bind_user( socket, CANOPIES )

	SOCKETS[ user.uuid ] = socket

	// log('flag', 'new player: ', user.uuid )

	canopy.join_user( user )

	// log('flag', '??', Object.keys( CANOPIES ))
	// log('flag', '??', Object.keys( canopy._PLAYERS ))

	const c = canopy.publish(['_seed'])

	// log('init_user', lib.identify( user ) + ' entering canopy: ', c )

	BROKER.publish('SOCKET_SEND', {
		socket: socket,
		packet: {
			type: 'private_init_world',
			canopy: c,	
			player1: user.publish(['_ref']),
			player_uuids: Object.keys( canopy._PLAYERS ),
		}
	})

}



const touch_canopy = async( identifier ) => {

	if( !env.STARTER_CANOPY ) return lib.return_fail( 'missing starter canopy', 'failed to init canopy')

	// find in memory
	let live_id
	if( identifier === 'any' ){
		live_id = env.STARTER_CANOPY
	}else if( typeof identifier === 'number' ){
		live_id = identifier
	}else{
		return lib.return_fail('invalid canopy identifier: ' + identifier, 'failed to init canopy')
	}

	for( const uuid in CANOPIES ){
		if( CANOPIES[ uuid ]._id === live_id ){
			return CANOPIES[ uuid ] // <--- ( return )
		}
	}

	// or, look up from db
	const pool = DB.getPool()
	let sql, res 
	if( typeof identifier === 'number' ){
		sql = 'SELECT * FROM canopies WHERE id=? LIMIT 1'
		res = await pool.queryPromise( sql, identifier )
	}else if( identifier === 'any' ){
		sql = 'SELECT * FROM canopies LIMIT 1'
		res = await pool.queryPromise( sql )
	}
	if( res.error ) return lib.return_fail( res.error, 'faild to get canopy')
	if( !res.results || !res.results.length ) return lib.return_fail('failed to find canopy: ' + identifier, 'failed to init canopy')

	const canopy = new Canopy( res.results[0] )
	await canopy.bring_online( CANOPIES )

	return canopy

}






const purge = event => {
	// packet abusers

	const { socket, uuid } = event

	const s = socket || SOCKETS[ uuid ]

	if( !s || !s.request || !s.request.session || !s.request.session.USER ){
		log('flag', 'invalid s purge' )
		return false
	}

	// log('flag', 'purging with coin: ', s.request.session.USER._PILOT._coin )

	let user = s.request.session.USER

	// const party = PARTIES.get_party( pilot.uuid )
	// if( party ) party.remove_member( pilot.uuid )

	for( const can_uuid in CANOPIES ){
		for( const uuid in CANOPIES[ can_uuid ]._PLAYERS ){
			if( uuid ===  user.uuid ){
				CANOPIES[ can_uuid ].remove_user( uuid )
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







BROKER.subscribe('GAME_PURGE', purge )




module.exports = {
	init_user,
}