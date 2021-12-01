const uuid = require('uuid').v4

class Being {

	constructor( init ){
		init = init || {}
		this._type = init.type || init._type
		// instantiated
		this.uuid = init.uuid || uuid()
		this._directionX = init._directionX
		this._directionY = init._directionY

		this._intervals = {}

	}

	unset( canopy ){

		const being = this

		being._deleted = true

		if( !canopy ) return

		for( const key in being._intervals ){
			clearTimeout( being._intervals[ key ])
			being._intervals[ key ] = false
		}
		
		delete canopy._NPCS[ being.uuid ]
		// delete ...
	}

}

module.exports = Being