const log = require('../utilities/log.js')
const BROKER = require('../utilities/EventBroker.js')
const Being = require('./Being.js')

class Npc extends Being {

	constructor( init ){
		super( init )
		init = init || {}
		this._type = 'npc'
		
		// instantiated
	}

	step( canopy ){

		const npc = this

		// shim
		npc.x += ( Math.random() > .5 ) ? 1 : -1
		npc.y += ( Math.random() > .5 ) ? 1 : -1
		// end shim

		BROKER.publish('BROADCAST', {
			sockets: canopy.getSockets(),
			packet: {
				type: 'step',
				uuid: npc.uuid,
				x: npc.x,
				y: npc.y,
			}
		})
		
		setTimeout(() => {
			if( !npc._deleted && !canopy._deleted ){
				npc.step( canopy )
			}
		}, 1500 )
	}

}

module.exports = Npc