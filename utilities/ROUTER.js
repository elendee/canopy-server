const log = require('./log.js')
const env = require('../.env.js')
const lib = require('./lib.js')

const BROKER = require('./EventBroker.js')
// const SOCKETS = require('../SOCKETS.js')








const bind_user = ( socket, CANOPIES ) => {

	let packet, CANOPY

	const USER = socket.request.session.USER

	if( !USER ){
		log('flag', 'failed to bind user')
		return
	}

	socket.on('message',  ( data ) => {

		try{ 

			packet = lib.sanitize_packet( JSON.parse( data ) )

			CANOPY = CANOPIES[ USER._canopy_uuid ]

			if( !CANOPY ){
				log('flag', 'invalid pilot canopy uuid: ', USER._canopy_uuid )
				// log('flag', 'missed packet: ', packet.type )
				for( const uuid in CANOPIES ){
					log('flag', 'available canopy: ', lib.identify( CANOPIES[ uuid ] ) )
				}

				return false
			}

			switch( packet.type ){

				// case 'player_move':
				// 	BROKER.publish('PLAYER_MOVE', {
				// 		canopy: CANOPY,
				// 		socket: socket,
				// 		packet: packet,
				// 	})
				// 	break;
				case 'update_blob':
					USER.update_blob( packet )
					BROKER.publish('BROADCAST', {
						sockets: CANOPY.getSockets(),
						packet: {
							type: 'update_blob',
							data: {
								uuid: USER.uuid,
								blob: USER.custom_data,
							}
						}
					})
					break;

				case 'ping_player':
					const p = CANOPY.getPlayer({ uuid: packet.data.uuid })
					if( !p ){
						log('flag', 'missing ping uuid: ', packet.data )
						return
					}
					BROKER.publish('SOCKET_SEND', {
						socket: socket,
						packet: {
							type: 'pong_player',
							data: {
								player: p.publish(),
							}
						}
					})
					break;

				case 'chat':
					BROKER.publish('CHAT', {
						canopy: CANOPY,
						socket: socket,
						packet: packet,
					})
					break;

				default: 
					log('flag', 'unknown event type')				
					break;

			}

		}catch(e){

			if( !socket.canopy_bad_packets ){
				socket.canopy_bad_packets = 1
			}else{
				socket.canopy_bad_packets++
				if( socket.canopy_bad_packets ){

				}
			}
			log('flag', 'err packet: ', e )
			// lib.bad_packet( socket )
			return false

		}

	})

	socket.on('error', function( data ){
		log('flag', 'socket error: ', data )
	})

	socket.on('close', function( data ){
		log('registry', 'socket close purge', lib.identify( USER ))
		BROKER.publish('GAME_PURGE', {
			socket: socket 
		})
	})

}














// SOCKET_SEND

const log_casts = ['chat']

const broadcast = event => {

	const { sockets, packet } = event

	if( !packet || !sockets || !packet.type ) return lib.return_fail({
		msg: 'invalid broadcast', 
		packet: packet }, 'invalid broadcast' )

	packet.ts = Date.now()

	if( log_casts.includes( packet.type ) ) log('broadcast', packet )

	const bundle = JSON.stringify( packet )
	for( const uuid in sockets ){
		sockets[ uuid ].send( bundle )
	}
}


// BROADCAST

const log_sends = ['chat']

const socket_send = event => {

	const { socket, packet } = event

	if( Object.keys( event ).length !== 2 ){
		log('flag', 'invalid socket send', packet )
		return 
	}

	packet.ts = Date.now()

	if( log_sends.includes( packet.type ) ) log('socket_send', packet )

	socket.send( JSON.stringify( packet ) )
}










BROKER.subscribe('SOCKET_SEND', socket_send )
BROKER.subscribe('BROADCAST', broadcast )








module.exports = {
	bind_user
}

