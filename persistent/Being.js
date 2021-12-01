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

}

module.exports = Being