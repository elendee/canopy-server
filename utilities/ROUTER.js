const log = require('./log.js')
const env = require('../.env.js')
const lib = require('./lib.js')

const BROKER = require('./EventBroker.js')
// const SOCKETS = require('../SOCKETS.js')






module.exports = {

	bind_user: ( socket, CANOPIES ) => {

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
					log('flag', 'invalid pilot system uuid: ', USER._system_uuid )
					// log('flag', 'missed packet: ', packet.type )
					for( const uuid in CANOPIES ){
						log('flag', 'available canopy: ', lib.identify( CANOPIES[ uuid ] ) )
					}

					return false
				}

				switch( packet.type ){

					case 'player_move':
						BROKER.publish('PLAYER_MOVE')
						break;

					case 'chat':
						BROKER.publish('CHAT')
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
				// lib.bad_packet( socket )
				return false

			}

		})

		socket.on('error', function( data ){
			log('flag', 'socket error: ', data )
		})

		socket.on('close', function( data ){
			log('registry', 'socket close purge', lib.identify( USER ))
			BROKER.publish('GAME_PURGE', socket )
		})

	}

}






