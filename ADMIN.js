
const log = require('./utilities/log.js')
const env = require('./.env.js')
const lib = require('./utilities/lib.js')
const DB = require('./persistent/db.js')

const mysqldump = require('mysqldump')






const delete_user = async( request, is_admin ) => {

	log('flag', 'unhandled delete_user from COIL')
	// if( is_admin ){
	// 	if( !lib.is_admin( request ) ) return lib.return_fail( 'admins only delete user', 'admins only')
	// }else{
	// 	if( !lib.is_logged( request ) ) return lib.return_fail( 'invalid delete_user', 'must be logged in')
	// 	if( request.session.USER._email !== request.body.email ) return lib.return_fail('invalid email delete account' + request.body.email, 'invalid email')
	// }
	// if( typeof request.body.email !== 'string' ) return lib.return_fail( 'invalid email ' + request.body.email, 'invalid email')

	// const pool = DB.getPool()
	// const sql = 'DELETE FROM users WHERE email=?'
	// const res = await pool.queryPromise( sql, [ request.body.email ] )
	// if( res.error ) return lib.return_fail( res.error, 'failed to delete user')

	// return {
	// 	success: true
	// }

}


const db_backup = async( request ) => {

	log('flag', 'unhandled db_backup from COIL')

	// if( !lib.is_admin( request )) lib.return_fail('unauthorized db_backup', 'admin only')

	// const stamp = Date.now()

	// try{
	// 	mysqldump({
	// 		connection: {
	// 			host: env.DB.HOST,
	// 			user: env.DB.USER,
	// 			password: env.DB.PW,
	// 			database: env.DB.NAME,
	// 		},
	// 		dumpToFile: './_storage/mysqldumps/COIL_backup-' + stamp + '.sql',
	// 		compressFile: false,
	// 	})
	// }catch( e ){
	// 	return lib.return_fail( e, 'backup failed')
	// }

	// return {
	// 	success: true,
	// 	msg: `backup complete - <a href="${ env.SITE_URL + '/_storage/mysqldumps/COIL_backup-' + stamp + '.sql' }">click here to download</a>`
	// }

}





module.exports = {

	db_backup,

	delete_user,

}