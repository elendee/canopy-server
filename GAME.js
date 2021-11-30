const log = require('./log.js')
const lib = require('./lib.js')
const Canopy = require('./persistent/Canopy.js')
// const User = require('./persistent/User.js')
const DB = require('./db.js')



const init_user = async( socket ) => {

	const user = socket.request.session.USER
	if( !user ) return lib.return_fail( 'no user rejected', 'no user found' )

	// get canopy
	let canopy
	if( !user._canopy_key ){
		canopy = await get_canopy('any')
		if( !canopy ) return lib.return_fail( 'no canopies', 'no canopy found')
		user._canopy_key = canopy.id
	}

	canopy = new Canopy( canopy )

	return {
		success: true,
		canopy: canopy.publish(),
	}

}



const get_canopy = async( identifier ) => {

	const pool = DB.getPool()
	let sql, res 
	if( typeof identifier === 'number' ){
		sql = 'SELECT * FROM canopies WHERE id=?'
		res = await pool.queryPromise( sql, identifier )
	}else if( identifier === 'any' ){
		sql = 'SELECT * FROM canopies LIMIT 1'
		res = await pool.queryPromise( sql )
	}
	if( res.error ) return lib.return_fail( res.error, 'faild to get canopy')
	return res.results[0]

}


module.exports = {
	init_user,
}