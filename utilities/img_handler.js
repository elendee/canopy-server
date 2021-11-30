const fs = require('fs')
const mkdirp = require('mkdirp')

const log = require('./log.js')
const env = require('../.env.js')
const lib = require('./lib.js')

const DB = require('../persistent/db.js')

const uuid = require('uuid').v4



module.exports = async( request ) => {

	// log('flag', 'img_handler: ', Object.keys( request.body ), typeof request.files )

	const validation_file = validate_upload_file( request )
	if( !validation_file.success ){
		return validation_file
	}

	const FILE = validation_file.file

	log('flag', 'file info?', FILE )
	if( FILE.size > 3000000 ) return lib.return_fail( 'file size reject ' + FILE.size, 'images must be 3mb max' )

	// log('flag', 'req files: ', Object.keys( request.files ) )
	// log('flag', 'req body: ', Object.keys( request.body ) )
	// log('flag',' FILE: ', FILE )

	const {
		success,
		msg,
		temp_path,
		final_path,
		file_url,
	} = validate_upload_meta( FILE, request ) // , gallery

	// log('flag', 'temp_path', temp_path )
	// log('flag', 'final_path', final_path )

	if( !success )  return {
		success: false,
		msg: msg,
		url: file_url,
	}

	mkdirp.sync( env.PRIVATE_ROOT + '/fs/', { mode: '0744' })

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
		success: true,
		url: file_url,
	}


}









const validate_upload_file = request => {

	if( !request.files ){
		return {
			success: false,
			msg: 'no file included',
		}
	}

	const FILE = request.files.upload

	if( !FILE.type.match(/image/) ){
		return {
			success: false,
			msg: 'only image uploads allowed',
		}
	}

	return {
		success: true,
		file: request.files.upload,
	}

}










const validate_upload_meta = ( file, request ) => { // , gallery

	// const dir_path = env.PRIVATE_ROOT + '/'
	const tempPath = file.path
	const file_URL = Date.now() + '_' + lib.random_hex(12) + '.jpg'
	const finalPath = env.PRIVATE_ROOT + '/fs/' + file_URL // + '.' + detect_filetype_suffix

	return { 
		success: true,
		temp_path: tempPath,
		final_path: finalPath,
		file_url: file_URL,
	}

	// return {
	// 	success: false,
	// 	msg: 'unable to save image information',
	// 	// dir_path,
	// 	// temp_path,
	// 	// final_path,
	// }

	// 	const artist = request.body.artist
	// 	const title = request.body.title
	// 	const description = request.body.description
	// 	const size = request.body.size
	// 	const anon = request.body.anon === 'false' ? false : true
	// 	const slot_index = request.body.slot_index
	// 	const pillar_uuid = request.body.pillar_uuid

	// 	let invalid
	// 	if( !lib.confirm_type('string', artist, true ) ) invalid = 'invalid artist'
	// 	if( !lib.confirm_type('string', description, true ) ) invalid = 'invalid description'
	// 	if( !lib.confirm_type('string', title, true ) ) invalid = 'invalid title'
	// 	if( !lib.confirm_type('string', size, true ) ) invalid = 'invalid size'
	// 	if( !lib.confirm_type('number', Number( slot_index ), false ) ) invalid = 'invalid slot ' + slot_index
	// 	if( !lib.confirm_type('string', pillar_uuid, false ) ) invalid = 'invalid pillar ' + pillar_uuid
	// 	// if( !lib.confirm_type())
		
	// 	if( invalid ){
	// 		log('flag', 'invalid upload: ', invalid )
	// 		return {
	// 			success: false,
	// 			msg: 'invalid upload',
	// 		}
	// 	}

	// 	let pillar
	// 	for( const uuid in gallery._PILLARS ){
	// 		if( uuid === pillar_uuid ){
	// 			pillar = gallery._PILLARS[ uuid ]
	// 		}
	// 	}

	// 	if( !pillar ){
	// 		return {
	// 			success: false,
	// 			msg: 'invalid location',
	// 		}
	// 	}

	// 	// pillar check slot is empty
	// 	const address = pillar.get_slot_address( slot_index )
	// 	if( !address ){
	// 		log('flag', 'invalid index: ', slot_index )
	// 		return {
	// 			success: false,
	// 			msg: 'invalid placement',
	// 		}
	// 	}
	// 	if( pillar.faces[ address[0] ][ address[1] ] ){
	// 		return {
	// 			success: false,
	// 			msg: 'slot is already filled',
	// 		}
	// 	}

	// // 	log('flag', `
	// // temp: ${ tempPath }
	// // file: ${ file_URL }
	// // base: ${ base_path } 
	// // final: ${ finalPath }
	// // `)

	// 	const now = Date.now()

	// 	// const file_URL = `${ now }__${ FILE.originalFilename }`
	// 	const file_URL = `${ now }__${ 'some-' + lib.random_hex(6) }`
	// 	const date_object = lib.derive_date_object( now ) // lib.generate_pathhash(
	// 	const dir_path = env.PRIVATE_ROOT + date_object.year + '/' + date_object.month + '/' + date_object.day + '/'

	// 	const tempPath = file.path
	// 	const finalPath = dir_path + file_URL // + '.' + detect_filetype_suffix

	// 	const piece = new Piece({
	// 		hash: file_URL,
	// 		_owner_key: request.session.USER._id,
	// 		_artist_key: request.session.USER._id,
	// 		_artist_handle: request.body.artist, //request.session.USER.handle : undefined,
	// 		_anon: anon,
	// 		title: title,
	// 		size: size,
	// 		description: description,
	// 		_pillar_key: pillar ? pillar._id : undefined,
	// 		slot_index: request.body.slot_index,
	// 		website: request.session.USER._website,
	// 	})


	// 	return {
	// 		success: true,
	// 		piece: piece,
	// 		pillar: pillar,
	// 		dir_path: dir_path,
	// 		temp_path: tempPath,
	// 		final_path: finalPath,
	// 		address: address,
	// 		// file_url: file_URL,
	// 	}

}



// how to delete:

// fs.unlink( tempPath, err => { // unecessary with autoClean
// 	if( err ) return false
// 	response.status(403).contentType('text/plain').end('invalid file upload')
// })