// const env = require('../.env.js')



class MessageBroker {

	constructor(){

		this.subscribers = {}

	}

	publish( event, data ){

		if( !this.subscribers[ event ] ) return

		// if( 0 && env.LOCAL && !env.LOG_BROKER_EXCLUDES.includes( event ) ){
		// 	if( event !== 'SOCKET_SEND' || !env.LOG_WS_SEND_EXCLUDES.includes( data.type ) ){
		// 		console.log( event, data )
		// 	}
		// }

	    this.subscribers[ event ].forEach( subscriberCallback => subscriberCallback( data ) )

	}

	subscribe( event, callback ){

		if( !this.subscribers[event] ){
			this.subscribers[event] = []
		}
	    
	    this.subscribers[event].push( callback )

	}

}

const broker = new MessageBroker()

module.exports = broker

