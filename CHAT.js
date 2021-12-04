const log = require('./utilities/log.js')
const lib = require('./utilities/lib.js')
const BROKER = require('./utilities/EventBroker.js')
const PRIVATE = require('./GLOBAL_PRIVATE.js')
const SOCKETS = require('./SOCKETS.js')


const handle_chat = event => {

	const { socket, packet, canopy } = event

	const { data } = packet

	log('chat', packet )

	let players
	const sockets = {}
	const sender = socket.request.session.USER

	switch( data.chat_type ){

		case 'say':
			players = canopy.getPlayers( sender._ref.position, PRIVATE.CHAT_RANGE )
			const keys = Object.keys( players )
			for( const uuid in SOCKETS ){
				if( keys.includes( uuid ) ) sockets[ uuid ] = SOCKETS[ uuid ]
			}
			break;

		case 'yell':
			players = canopy.getPlayers() // sender._ref.position, PRIVATE.CHAT_RANGE
			break;

		case 'whisper':
		case 'emote':
		default: 	
			log('flag', 'unhandled chat type:', data.chat_type )
			break;
	}

	if( !players ) return lib.return_fail('no players for chat: ' + data.msg, 'chat not sent')

	canopy.broadcast( sockets, {
		type: 'chat',
		chat_type: data.chat_type,
		msg: data.msg,
		sender_uuid: sender.uuid,
	})

}


BROKER.subscribe('CHAT', handle_chat )