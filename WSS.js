const WebSocket = require('ws')

const env = require('./.env.js')


let wss = false

function getInstance(){

	if( wss ) return wss

	wss = new WebSocket.Server({
		// port: env.PORT,// + 1,
		noServer: true, // ^^ mutex
		clientTracking: true,
	})

	wss.user_data = { // use this instead of passing WebSocket everywhere Server is required
		OPEN: WebSocket.OPEN
	}

	return wss

}

module.exports = getInstance

