const fs = require('fs')
const mkdirp = require('mkdirp')

const log = require('./log.js')
const env = require('../.env.js')
const lib = require('./lib.js')

const DB = require('../persistent/db.js')
const { dir } = require('console')

// const Piece = require('../persistent/Piece.js')






module.exports = async( request ) => {

	log('file_handler', request.body )

	const validation_file = validate_upload_file( request )
	if( !validation_file.success ){
		return validation_file
	}

	const FILE = validation_file.file

	const {
		success,
		msg,

		dir_path,
		temp_path,
		final_path,

	} = validate_upload_meta( FILE, request )

	if( !success )  return {
		success: false,
		msg: msg,
	}
 
	// log('flag', 'req files: ', Object.keys( request.files ) )
	// log('flag', 'req body: ', Object.keys( request.body ) )
	// log('flag',' FILE: ', FILE )

	mkdirp.sync( dir_path, { mode: '0744' })

	const op_state = await new Promise((resolve, reject) => {

		fs.rename( temp_path, final_path, err => { // finalPath
			if( err ){
				log('flag', 'err fs save: ', err )
				reject({
					success: false,
					msg: 'error saving file',
				})

			}else{

				resolve({ success: true })				

			}

		})
	})

	if( !op_state.success ) return op_state

	return {
		success: true
	}


}









const validate_upload_file = request => {

	if( !request.files ) return lib.return_fail( 'no file', 'no file included')

	const FILE = request.files.upload

	if( !FILE.type.match(/image/) ) return lib.return_fail( 'only images allowed', 'only images allowed')

	return {
		success: true,
		file: request.files.upload,
	}

}










const validate_upload_meta = ( file, request ) => {

	let dir_path, temp_path, final_path

	const { clearance, type } = request.body

	if( !file ) return lib.return_fail('no file for upload', 'no file for upload')

	if( clearance !== env.CLEARANCES[ type ] ) return lib.return_fail( 'invalid clearance: ' + clearance + '/' + type, 'invalid clearance' )

	// const file_URL = `${ now }__${ 'some-' + lib.random_hex(6) }`
	// const date_object = lib.derive_date_object( now ) // lib.generate_pathhash(
	// const dir_path = env.UPLOAD_DIR + date_object.year + '/' + date_object.month + '/' + date_object.day + '/'

	const tempPath = file.path

	switch( type ){
		case 'ja-script':
			dir_path = env.PRIVATE_ROOT + '/client/js/collab/'
			final_path = dir_path + 'jaman.js'
			break;
		case 'ok-script':
			dir_path = env.PRIVATE_ROOT + '/client/js/collab/'
			final_path = dir_path + 'okra.js'
			break;
		default:
			return lib.return_fail( 'invalid file upload type: ' + type, 'invalid upload type')
	}

	return {
		success: true,
		msg: 'meta validated',
		dir_path: dir_path,
		temp_path: tempPath,
		final_path: final_path,
	}

}



// how to delete:

// fs.unlink( tempPath, err => { // unecessary with autoClean
// 	if( err ) return false
// 	response.status(403).contentType('text/plain').end('invalid file upload')
// })