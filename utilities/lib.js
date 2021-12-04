const env = require('../.env.js')

// const GLOBAL_PUBLIC = require('./GLOBAL_PUBLIC.js')
const BROKER = require('./EventBroker.js')

const STORE = require('../memstore.js')

const log = require('./log.js')

const sanitize_html = require('sanitize-html')

const p_validator = require('password-validator')
const e_validator = require('email-validator')

const name_schema = new p_validator()

const password_schema = new p_validator()


name_schema
	.is().min(1)
	.is().max(25)
	// .has().not().spaces()
	// .has().not().digits()

password_schema
	.is().min(5)
	.is().max(25)
	.has().not().spaces()




const tables = {
	verboten: ['fuk', 'fuck', 'cunt', 'damn', 'nigger', 'kike', 'chink', 'bitch'],
	max_name_length: 30
}



function sanitize_packet( packet ){

	return packet

}

function parse_id( id ){

	if( !id ) return false
	if( id.toString ) return id.toString()
	if( typeof( id ) === 'string' ) return id
	return false

}




function zone_id( x, z, layer ){
	if( typeof( x ) !== 'number' || typeof( z ) !== 'number' || typeof( layer ) !== 'number' ){
		log('flag', 'failed to build zone id: ', x, z, layer )
		return false
	}
	return x + '-' + z + '-' + layer
}



function two_decimals( float ){

	return Math.round(( float + Number.EPSILON ) * 100) / 100

}

function rgb_to_hex( rgb_color, received_scale, type ){
	let numbers
	if( type == 'array' ){
		numbers = rgb_color
	}else{
		numbers = rgb_color.split("(")[1].split(")")[0];
		numbers = numbers.split(",");
		numbers.forEach(function( num ){
			num = num.trim()
		})
	}
	if( received_scale === 1 ){
		for( let i=0; i < numbers.length; i++ ){
			numbers[i] *= 255
		}
	}else if( received_scale !== 255 ){
		return '#000'
	}
	let b = numbers.map( function(x){						 
		x = parseInt( x ).toString( 16 )
		return ( x.length == 1 ) ? "0" + x : x
	})
	b = "0x" + b.join
	return b
}





function capitalize( input ){

	if( typeof input !== 'string' ) return undefined

	return input.charAt(0).toUpperCase() + input.slice(1);

}






function sanitize_chat( chat ){

	if( typeof( chat ) === 'string' ){
		chat = chat.substr( 0, 240 )
		for( const v of tables.verboten ){
			let r = new RegExp( v, 'g')
			chat = chat.replace(r, '---')
		}
		return chat
	}
	return false

}




function is_valid_name( name ){

	let valid = true

	if( !name ) valid = false

	// let regex = new RegExp( name, 'i' )

	// || name.length > tables.max_name_length

	if( typeof( name ) !== 'string' ) return false // yes skip the log here, could be huge

	if( name.match(/^null$/i) ) valid = false

	if( !name_schema.validate( name + '' ) ) valid = false

	// if ( !/^([a-zA-Z]|\'|_|[0-9])*$/g.test( name ) ) valid = false

	// for( const w of tables.verboten ){
	// 	if( w.match( regex )){
	// 		valid = false
	// 	}
	// }

	if( !valid ) {
		log('flag', 'name regex failed: ', name )
		return false
	}

	return true

}



function is_valid_email( email ){
	if( !e_validator.validate( email ) ) return false
	return true
}


function is_valid_password( password ){

	let valid = true

	if( typeof( password ) !== 'string' ) valid = false

	if( !password_schema.validate( password )) valid = false

	if( password.match(/^null$/i) ) valid = false

	if( !valid ){
		log('flag', 'invalid pw: ', password )
		return false
	}

	return true

}



function is_valid_website( website ){

	let valid = true

	if( typeof( website ) !== 'string' ) valid = false

	if( !website.match(/\..*/) ) valid = false

	if( !valid ){
		log('flag', 'invalid website')
		return false
	}

	return true

}



function is_valid_portrait( portrait ){

	let valid = true

	if( typeof( portrait ) !== 'string' ) valid = false

	if( !portrait.match(/\..*/) ) valid = false

	if( !valid ){
		log('flag', 'invalid portrait')
		return false
	}

	return true

}



function random_hex( len ){

	//	let r = '#' + Math.floor( Math.random() * 16777215 ).toString(16)
	let s = ''
	
	for( let i = 0; i < len; i++){
		
		s += Math.floor( Math.random() * 16 ).toString( 16 )

	}
	
	return s

}



function random_rgb( ...ranges ){ // ( [0,255], [0,255], [0,255] )

	let inc = 0
	let string = 'rgb('

	for( const range of ranges ){

		if( range[1] < range[0] || range[0] < 0 || range[1] > 255 ) return 'rgb( 0, 0, 0 )'

		string += range[0] + Math.floor( Math.random() * ( range[1] - range[0] )) 

		inc < 2 ? string += ',' : true

		inc++

	}

	return string + ')'

}








function is_iso_date( data ){

	if( typeof( data ) !== 'string' || !data.match(/^\d{4}-([0]\d|1[0-2])-([0-2]\d|3[01])/)){
		log('flag','failed ISO test', data )
		return false
	}

	return true

}



// function validate_timestamp( ...vals ){

// 	for( const ts of vals ){
// 		if( typeof ts === 'string' || ( ts && typeof Number( ts ) === 'number' ) ) return Number( ts )
// 	}
// 	return vals[ vals.length - 1 ]

// }


function validate_number( ...vals ){

	for( const num of vals ){
		if( typeof num === 'number' || ( num && typeof Number( num ) === 'number' ) ) return Number( num )
	}
	return vals[ vals.length - 1 ]

}



function validate_ISO( val ){

	if( typeof val === 'string'){
		if( val.match(/Z$/)) return val
		return new Date( val ).toISOString()
	}else{
		if( val && val.toISOString ) return val.toISOString()
	}
	return new Date().toISOString()

}



function validate_string( ...vals ){

	for( const str of vals ){
		if( typeof( str ) === 'string' ) return str
	}
	return vals[ vals.length - 1 ]

}



function validate_seconds( ...vals ){

	for( const val of vals ){
		if( typeof( val ) === 'number' && val > 1000000000 )  return val
	}
	return vals[ vals.length - 1 ]
	
}






const _enum = {
	
}





function is_admin( request ){

	return request && request.session && request.session.USER && env.ADMINS.includes( request.session.USER._email )  // env.ADMINS.includes( request.session.USER._id )

}


function is_test_account( request ){

	return request && request.session && request.session.USER && env.TESTERS.includes( request.session.USER._email )

}

function is_logged( request ){

	return request.session && request.session.USER && typeof request.session.USER._id === 'number'

}


function is_valid_param( params, param ){

	// uses blacklist approach for convenience - switch to whitelist .....

	if( ( param === 'country' || param === 'partner_countries' ) && params[ param ] === 'none' ) return false
	if( !params[ param ] ) return false
	return true

}


const valid_bools = [0, 1, true, false, 'true', 'false', undefined, null]

const is_valid_bool = value => {
	for(const val of valid_bools ){
		if( val === value ) return true
	}
	return false
}




const format_strings = ( msg, params ) => {

	if( typeof msg !== 'string' )  return msg

	params = params || {}

	let res = msg

	if( params.line_breaks ) res = res.replace(/\<br\/?\>/g, '\n')

	if( params.strip_html ) res = res.replace(/(<([^>]+)>)/gi, '')

	if( params.sanitize_html ) res = sanitize_html( res ) // log('flag', 'MISSING SANITIZE HTML HERE')

	if( params.strip_scripts ) log('flag', 'MISSING SCRIPT SANITIZE STILL')

	if( params.encode ) res = encodeURIComponent( res ) // or encodeURI for less strict encoding

	return res

}


// const html_to_text = ( msg, encode ) => {

// 	let res = msg.replace(/\<br\/?\>/g, '\n')

// 	if( encode ) res = encodeURIComponent( res ) // or encodeURI for less strict encoding

// 	res = res.replace(/(<([^>]+)>)/gi, '')

// 	return res

// }


// const validate_date_object = ( ...vals ) => {

// 	for( const val of vals ){
// 		if( val && val.isISOString ) return val
// 	}
// 	return vals[ vals.length - 1 ]

// }

// const to_datetime = ( date, days_only ) => {

// 	if( !date.toISOString ){
// 		log('flag', 'to_datetime requires a Date object as arg')
// 		return false
// 	}
// 	// YYYY-MM-DD HH:mm:ss
// 	const full = `${ date.getYear() }-${ date.getMonth().toLocaleString( undefined, { minimumIntegerDigits: 2 } ) }-${ date.getDay().toLocaleString( undefined, { minimumIntegerDigits: 2} ) } ${ date.getHours().toLocaleString( undefined, {minimumIntegerDigits: 2 } ) }:${ date.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2}) }:${ date.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2}) }`
// 	const days = `${ date.getYear() }-${ date.getMonth().toLocaleString( undefined, { minimumIntegerDigits: 2 } ) }-${ date.getDay().toLocaleString( undefined, { minimumIntegerDigits: 2} ) } `
// 	if( days_only ){
// 		return days
// 	}else{
// 		return full
// 	}	

// }



const parse_concat = ( concat_string ) => {

	let vals = []

	if( typeof concat_string !== 'string' ) return vals
	if( concat_string.match('-') ){
		vals = concat_string.split('-')
		for( let i = vals.length - 1; i >= 0; i-- ){
			if( !vals[i] ){
				vals.splice( i, 1 )
			}
		}
	}
	return vals

}


const separate = ( character, input_array, spaces ) => { // ( *not technically a CSV ! )

	let return_val = ''

	for( let i = 0; i < input_array.length; i++ ){
		return_val += input_array[i]
		if( i < input_array.length - 1 ){
			return_val += ( spaces ? character + ' ' : character )
		}
	}

	return return_val

}



const return_fail = ( private_err, public_err, preface ) => {

	log('flag', preface ? preface : 'return_fail: ', private_err )

	return {
		success: false,
		msg: public_err,
	}

}


const return_fail_socket = ( socket, msg, time ) => {

	if( !socket ) return

	BROKER.publish('SOCKET_SEND', {
		socket: socket,
		packet: {
			type: 'hal',
			data: {
				msg_type: 'error',
				msg: msg,
				time: time,
			}
		}
	})

	return false

}





const array_move = ( array, from, to ) => {
    array.splice( to, 0, array.splice(from, 1)[0] )
    return array
}




const get_owner_email = async( pool, inst ) => {

	if( !inst ) return false
	const owner_key = inst._owner_key || inst.owner_key
	if( !owner_key ) return false

	const sql = 'SELECT email FROM users WHERE id=?'
	const res = await pool.queryPromise( sql, owner_key )
	if( res.error ){
		log('flag', 'err getting owner email: ',  res.error )
		return undefined
	}

	return res.results[0].email

}



const user_html = ( msg, params ) => {

	if( typeof msg !== 'string' )  return msg

	params = params || {}

	let res = msg

	if( params.line_breaks ) res = res.replace(/\<br\/?\>/g, '\n')

	if( params.strip_html ) res = res.replace(/(<([^>]+)>)/gi, '')

	if( params.encode ) res = encodeURIComponent( res ) // or encodeURI for less strict encoding

	return res

}




const has_inst = request => {
	if( !is_logged( request ) ) return false
	if( request.session.USER.has_inst ) return true
	return false
}


const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}



const is_valid_handle_prefix = value => {
	if( typeof value !== 'string' || value.length < 3 || value.length > 15 ){
		return false
	}
	if( value.match(/\#/)) return false
	return true
}



const identify = obj => {
	obj = obj || {}
	let id = 'id: '
	if( typeof obj === 'string' ) return id + obj
	if( obj.name ) return id + 'name: ' + obj.name
	if( obj.subtype ) return id + 'subtype: ' + obj.subtype
	if( obj.type ) return id + 'type: ' + obj.type
	if( obj.email ) return id + 'email: ' + obj.email
	return '(unknown identify)'
}




module.exports = {
	tables,
	sanitize_chat,
	sanitize_packet,
	parse_id,
	two_decimals,
	rgb_to_hex,
	is_valid_portrait,
	is_valid_website,
	is_valid_password,
	is_valid_portrait,
	is_valid_name,
	is_valid_email,
	is_valid_param,
	is_valid_bool,
	is_valid_handle_prefix,
	random_hex,
	random_rgb,
	zone_id,
	capitalize,
	is_iso_date,
	validate_number,
	validate_string,
	validate_seconds,
	validate_ISO,
	// validate_date_object,
	// validate_UTC,
	// validate_vec3,
	// validate_quat,
	// range_map,
	// get_dist,
	identify,
	// mumble,
	_enum,
	// publish,
	is_admin,
	is_logged,
	is_test_account,
	// html_to_text,
	format_strings,
	// to_datetime,
	parse_concat,
	separate,
	return_fail,
	return_fail_socket,
	array_move,
	get_owner_email,
	user_html,
	has_inst,
	sleep,
}

