
const bcrypt = require('bcryptjs')

const log = require('./log.js')
const env = require('./.env.js')
const lib = require('./lib.js')

const DB = require('./db.js')

const SALT_ROUNDS = 10

const User = require('./User.js')

const { canopymail } = require('./mail.js')










async function login_user( request ){

	const email = request.body.email.toLowerCase().trim()
	const password = request.body.password.trim()

	log('flag', 'login:', email, password )

	let msg
	if( !password ) msg = 'no password given for login'
	if( !email ) msg = 'no email given for login'
	if( msg ) return lib.return_fail( 'invalid login : ' + msg, msg )

	if( request.session.USER._id && request.session.USER.email === email ){
		log('flag', 'success login') // already logged...
		return { success: true }
	}

	const user = await select_user( 'email', email )
	if( !user ) return lib.return_fail( 'no email: ' + email, 'no user found for login')

	log('flag', 'user: ', user )

	const hash_pw = user.password

	const bcrypt_boolean = await bcrypt.compare( password, hash_pw )

	if( !password || !hash_pw )  bcrypt_boolean = false

	if( bcrypt_boolean ){

		request.session.USER = new User( user )

		// log('flag', 'user login: ', request.session.USER )

		return { 
			success: true,
			admin: lib.is_admin( request ),
		}

	}else{

		return lib.return_fail( 'bad pw block', 'incorrect password')

	}

}








async function register_user( request ){

	if( lib.is_logged( request ) ) return lib.return_fail( 'already logged in', 'sign out before attempting to register')

	const pool = DB.getPool()

	const email = request.body.email.toLowerCase().trim()
	const handle = request.body.handle.trim()
	const pw = request.body.password.trim()

	const sql = 'SELECT * FROM users WHERE email=?'
	const res = await pool.queryPromise( sql, email )
	if( res.error || !res.results ) return lib.return_fail( res.error, 'error attempting register')
	if( res.results.length ) return lib.return_fail( 'no emails', 'email in use')

	const full_handle = handle + '#' + lib.random_hex( 6 )

	let invalid = false
	if( !lib.is_valid_email( email )){
		invalid = 'invalid email'
	}else if( !lib.is_valid_password( pw )){
		invalid = 'invalid password'
	}else if( !lib.is_valid_handle_prefix( handle ) ){
		invalid = 'invalid handle - must be 3 to 15 characters and cannot include the "#" character'
	}

	if( invalid ) return lib.return_fail( invalid + ' ' + JSON.stringify( request.body ),'invalid register: ' + invalid )

	let salt = bcrypt.genSaltSync( SALT_ROUNDS )
	let hash = bcrypt.hashSync( pw, salt )

	const ck = lib.random_hex( 6 )

	const NOW = new Date().getTime()

	request.session.USER = new User({

		email: email,
		handle: full_handle,
		_password: hash,
		_confirm_sent: NOW,
		_confirm_key: ck,
		_is_subscribed: request.body.is_subscribed,
		_last_visited: NOW,

	})

	log('flag', 'probs fine?', request.session.USER._created )
	log('flag', 'probs fine?', request.session.USER._edited )

	// also saves user:
	const info = await send_confirm_mail( request.session.USER, true )

	const register_msg = `
Thanks for registering!<br>
<br>
Check your email for confirm. 
`
	return { 
		success: true,
		msg: register_msg,
	}

}



const send_confirm_mail = async( user, new_one ) => {

	user._confirm_sent = Date.now()

	const res = await user.save()

	if( new_one ){
		user._id = res.id
	}

	const html = new_one ? 
	'Click <a target="_blank" href="' + env.SITE_URL + '/process_confirm?e=' + user.email + '&k=' + user._confirm_key + '">this link</a> to confirm.<br><br>' : 
	'Here is a new confirmation link for ' + env.SITE_TITLE + ':<br> <a target="_blank" href="' + env.SITE_URL + '/process_confirm?e=' + user.email + '&k=' + user._confirm_key + '">Click here to Confirm</a>'

	const mailOptions = {
		from: env.mail_admin,
		to: user.email,
		subject: 'Confirm your ' + env.SITE_TITLE + ' account',
		html: html,
		text: lib.user_html( html, {
			line_breaks: true,
			strip_html: true,
		})
	}

	const info = await canopymail( mailOptions )

	return {
		success: info.response && info.response === 'sent',
	}

}




async function select_user( type, value ){

	const pool = DB.getPool()

	let field
	if( type == 'email' ){
		field = '`email`'
	}else if( type == 'id' ){
		field = '`id`'
	}

	if( !field ) return lib.return_fail( 'invalid lookup: ' + type, 'invalid user')

	const sql = 'SELECT * from `users` WHERE ' + field + ' = ? LIMIT 1'

	const { error, results, fields } = await pool.queryPromise( sql, [ value ] ) 
	if( error ) throw new Error( error )
	// if( !results || !results[0] ) return lib.return_fail( 'no results for user: ' + value, 'no user found' )

	return results[0]

}





const logout_user = async( request ) => {

	log('flag', 'logging out user....')

	if( !lib.is_logged( request ) ) return lib.return_fail('no user for logout', 'no user is logged in')

	log('flag', 'session destroy....')

	request.session.destroy()


	return {
		success: true,
	}

}








const send_reset = async( request ) => {

	if( !request.body.email || !lib.is_valid_email( request.body.email ) ){
		return {
			success: false,
			msg: 'invalid email'
		}
	}

	if( !env.MAIL_PW ){
		return {
			success: false,
			msg: 'skipping resets'
		}
	}

	const pool = DB.getPool()
	const sql = 'SELECT * FROM users WHERE email=?'
	const res = await pool.queryPromise( sql, request.body.email )
	if( !res || res.error ) return lib.return_fail( res.error, 'error sending reset')
	if( !res.results || !res.results.length ) return lib.return_fail( 'no user: ' + request.body.email, 'unable to find user')

	const user = res.results[0]

	const reset_hash = lib.random_hex( 8 )

	const reset_res = await update_user_reset( request.body.email, reset_hash )
	if( !reset_res ) return lib.return_fail( 'fail reset', 'failed to initialize reset')

	const recipient = request.body.email.toLowerCase().trim()

	const query_string = '?r=' + reset_hash + '&e=' + recipient
	// const html_query_string = '?r=' + reset_hash + '&e=' + recipient.replace('@', '<span>@</span>').replace(/\./, '<span>.</span>')

	const mailOptions = {
		from: env.mail_admin,
		to: recipient,
		subject: env.SITE_TITLE + ' password reset',
		text: 'Navigate to this link to reset your password: ' + env.SITE_URL + '/reset' + query_string,
		html: '<p><a href="' + env.SITE_URL + '/reset' + query_string + '"><strong>click here</strong></a> to reset password</p><p>If link doesn\'t work, copy and paste:</p><pre>' + env.SITE_URL + '/reset' + query_string + '</pre>',
		// html: '<a href="https://games-workshop.com">some sample link</a>'
	}

	// log('flag', 'mailing: ', mailOptions )

	await canopymail( mailOptions )

	return { 
		success: true,
		msg: 'sent email to ' + recipient
	}

}






const update_user_reset = async( email, reset_hash ) => {

	const pool = DB.getPool()

	const sql = 'UPDATE users SET reset_hash=? WHERE email=?'

	const { error, results, fields } = await pool.queryPromise( sql, [ reset_hash, email ] )
	if( error || !results ){
		if( error){
			log('flag', error )
		}else if( !results ){
			log('flag', 'no users found to update hash')
		}
		return false
	}

	return { success: true }

}






const reset_pass = async( request ) => {

	///// validate

	if( !request.body.password || !request.body.email || !request.body.reset_hash ){
		request.body.password = '[[' + typeof request.body.password + ']]'
		log('flag', 'invalid reset_pass: ', request.body )
		return {
			success: false,
			msg: 'invalid reset auth'
		}
	}

	const u = await select_user('email', request.body.email )
	if( !u ){
		log('flag', 'no user found for reset pass', request.body.email )
		return {
			success: false,
			msg: 'could not find user for reset'
		}
	}
	const user = new User( u )

	// log('flag', user )

	let err 
	if( !user._reset_hash || user._reset_hash !== request.body.reset_hash )  err = 'invalid reset code <a href="/send_reset">request a new one</a>If you request multiple times, be sure to use the latest code.'
	if( !lib.is_valid_password( request.body.password ))  err = 'invalid password'

	if( err ){
		log('flag', 'reset pass err: ', request.body.email, err )
		return {
			success: false,
			msg: err
		}
	}

	///// ok, update

	const res = await update_pass( request.body.email, request.body.password )

	return res

}





const update_pass = async( email, password ) => {

	const new_reset_key = lib.random_hex( 8 )

	const salt = bcrypt.genSaltSync( SALT_ROUNDS )
	const new_pass = bcrypt.hashSync( password, salt )

	const pool = DB.getPool()
	const sql = 'UPDATE users SET reset_hash=?, password=?, confirmed=1 WHERE email=?'

	const { error, results, fields } = await pool.queryPromise( sql, [ new_reset_key, new_pass, email ])
	if( error || !results ){
		if( error ){
			log('flag', error )
		}else{
			log('flag', 'no users found for password reset')
		}
		return false
	}

	return {
		success: true,
		msg: 'password updated'
	}


}


const confirm_account = async( request, STORE ) => {

	const pool = DB.getPool()

	const { email, ck, q } = request.body

	if( q ){
		log('flag', 'attempting confirm derived from query string: ' + q )
	}

	await lib.sleep( 500 ) // bot sand

	if( !lib.is_valid_email( email ) ) return lib.return_fail( 'inavlid email: ' + email, 'invalid email detected' )

	// find confirming user
	const user = await select_user( 'email', email )
	if( !user ) return lib.return_fail( 'no user: ' + email, 'no user found for confirm')
	if( user.confirmed ) return lib.return_fail( 'already confirmed: ' + email, 'user already confirmed')

	const is_admin = request.body.is_admin_confirmation && lib.is_admin( request )

	// basic key validation
	if( !is_admin && user.confirm_key !== ck ) return lib.return_fail( 'invalid key ' + ck, 'invalid key' )

	const NOW = Date.now()

	// check time window
	const window_sql = 'SELECT confirm_sent FROM users WHERE email=?'
	const window_res = await pool.queryPromise( window_sql, email )
	if( window_res.error ) return lib.return_fail( window_res.error, 'error checking time window')

	const confirm_sent = Number( window_res.results[0].confirm_sent || 0 )
	if( typeof confirm_sent !== 'number' ){
		return lib.return_fail( 'invalid confirm sent: ' + confirm_sent, 'unable to send confirmation code')
	}

	const elapsed = Date.now() - confirm_sent
	// log('flag', 'elapsed ms since register: ', elapsed )

	if( elapsed > env.CONFIRM_WINDOW && !is_admin ){

		setTimeout(() => {

			const u = new User( user )
			u._confirm_key = lib.random_hex( 6 )
			u.save()
			.then( res => {
				send_confirm_mail( u, null )
				.then( mailinfo => {
					// 
				})
				.catch( err => {
					log('flag', 'err on reset confirm timeout:', err )
				})
			})
			.catch( err => {
				log('flag', 'save err: ', err )
			})

		}, 1000 )

// 		const overtime_msg = `
// You waited more than ${ env.CONFIRM_MINUTES } minutes to respond. <br>
// If you click this button, we will send another link to the same email address. <br>
// Be sure to check your spam/junk mail if you do not receive it.<br>
// If you do not receive it after multiple attempts, register with a different email address.<br>
// `

		// give them fail message before ^^
		const minutes = Math.floor( elapsed / 1000 / 60 )
		return lib.return_fail('too long elapsed confirm: ' + minutes + ' minutes', 'too long elapsed' )
	}

	// user confirm is valid
	const sql = 'UPDATE users SET confirm_key=NULL, confirmed=1, confirm_date=? WHERE email=?'

	const { error, results, fields } = await pool.queryPromise( sql, [ NOW, email ] )
	if( error || !results || !results.affectedRows ){
		if( error ){
			log('flag', error )
		}else if( !results || !results.affectedRows ){
			log('flag', 'no users found to update')
		}
		return false
	}

	if( is_admin ){	
		
		STORE.all( ( err, sessions ) => {
			if( err ){
				log('flag', 'err get store sessions: ', err )
			}
			for( const id in sessions ){
				if( sessions[ id ].USER && sessions[ id ].USER.email === email ){
					STORE.destroy( id, err => {
						if( err ){
							log('flag', 'err sess destroy: ', err )
						}
					})
					// ok
				}
			}
		})

	}else{ // user has provided key from email so it must be them or someone with access

		request.session.USER = new User( user )
		request.session.USER._confirmed = true

		const csql = 'UPDATE users SET confirmed=?, confirm_date=? WHERE id=?'
		const cres = await pool.queryPromise( csql, [ true, NOW, request.session.USER._id ])
		if( cres.error ) return lib.return_fail( cres.error ,log('flag', 'error updating user confirmed') )

		// request.session.USER._confirm_date = NOW
		// request.session.USER.save().catch( err => {
		// 	log('flag', 'save confirm err', err )
		// })

	}

	return {
		success: true,
	}

}


// const confirm = async( queries ) => {

// 	const u = await select_user('email', queries.e )
// 	if( !u ){
// 		return {
// 			success: false,
// 			msg: 'could not find user for confirm'
// 		}
// 	}

// 	// const pool = DB.getPool()
// 	// const sql = 'SELECT * FROM users WHERE email=?'

// 	// const { error, results, fields } = await pool.queryPromise( sql, [ queries.e ] )
// 	// if( error || !results ){
// 	// 	if( error ){
// 	// 		log('flag', error )
// 	// 	}else{
// 	// 		log('flag', 'no users found to confirm')
// 	// 	}
// 	// 	return false
// 	// }

// 	// const user = new User( results[0] )
// 	const user = new User( u )

// 	let valid = false

// 	if( user._confirm_key ){

// 		if( user._confirm_key === queries.ck ){

// 			await user.set_confirmed()
// 			valid = true

// 		}

// 	}

// 	if( !valid ){
// 		return { 
// 			success: false,
// 			msg: 'invalid confirmation code'
// 		}
// 	}else{
// 		return { success: true }
// 	}

// }




module.exports = {
	register_user,
	select_user,
	login_user,
	logout_user,
	send_reset,
	reset_pass,
	// confirm
	confirm_account,
	send_confirm_mail,
}
