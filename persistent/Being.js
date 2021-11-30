const uuid = require('uuid').v4

class Being {

	constructor( init ){
		init = init || {}
		this._type = init.type || init._type
		// instantiated
		this.uuid = init.uuid || uuid()
		this._directionX = init._directionX
		this._directionY = init._directionY
	}

	step( canopy ){
		log('flag', 'npc step !')
		const being = this
		
		setTimeout(() => {
			if( !being._deleted ){
				being.step()
			}
		})
	}

}

module.exports = Being