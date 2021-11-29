const env = require('./.env.js')
const log = require('./log.js')
const lib = require('./lib.js')

const { coilmail } = require('./mail.js')

const contact_inst = async( request, response, pool ) => { // POST

	if( !request.body.msg ){
		// not required	
	}
	if( !request.body.inst ){
		return {
			success: false,
			msg: 'invalid institution',
		}
	}

	let inviter_id, inviter_iid, inviter_name, inviter_user_name
	let invited_id, invited_iid, invited_name, invited_user_name
	let invitation
	// let inviter_email, invited_email, inviter_name, invited_name, inviter_user_name, invited_user_name, invitation
	inviter_email = request.session.USER.email
	invited_iid = request.body.inst
	invitation = request.body.msg

	if( lib.is_admin( request ) ){ // administrator is contacting Institution

		// log('flag', 'testing: ', invited_iid )

		// const sql3 = 'SELECT users.email FROM users INNER JOIN institutions ins ON ins.owner_key = users.id WHERE ins.iid = ? AND ins.confirmed=1 AND ins.published=1'
		const sql = 'SELECT users.email, users.name, users.surname FROM users INNER JOIN institutions ins ON ins.owner_key=users.id WHERE ins.iid=? AND ins.published=1'

		const res = await pool.queryPromise( sql, invited_iid )
		if( res.error ){
			log('flag', 'contact err: ', res.error )
			return { success: false }
		}

		// log('flag', 'res: ', res )

		if( !res.results.length ){
			return {
				success: false,
				msg: 'Institution not found'
			}
		}

		invited_user_name = res.results[0].name || ''
		inviter_user_name = request.session.USER.name ? request.session.USER.name + ' ' + ( request.session.USER._surname || '' ) : ''
		invited_email = res.results[0].email || ''

		const msg_html = `An administrator from COIL Connect ${ inviter_user_name ? ', ' + inviter_user_name + ', ' : '' } has sent you a message:<br><br>${ invitation }<br><br>Do not reply to this email<br><br>Please email them at their email address:<br>${ inviter_email }<br><br>Thanks!<br>- COIL Connect for Virtual Exchange`

		const info = await coilmail({
			from: env.mail_admin,
			to: invited_email,
			subject: 'A message from COIL Connect VE',
			html: msg_html,
			text: lib.format_strings( msg_html, { line_breaks: true } ),
		})

		const cc = await coilmail({
			from: env.mail_admin,
			to: request.session.USER.email,
			subject: '[COPY] A message from COIL Connect VE',
			html: msg_html,
			text: lib.format_strings( msg_html, { line_breaks: true } ),
		})

		return { success: true }

	}else{ // normal Institution contact

		///////////////// lookup inviter inst iid

		const sql1 = 'SELECT id, iid, name FROM institutions WHERE owner_key=? LIMIT 1'
		const res1 = await pool.queryPromise( sql1, request.session.USER._id )
		if( res1.error || !res1.results || !res1.results.length ){
			if( res1.error ) log('flag', 'lookup Inst contact err:', res1.error )
			return {
				success: false,
				msg: 'failed to find sending institution'
			}
		}

		inviter_id = res1.results[0].id
		inviter_iid = res1.results[0].iid
		inviter_name = res1.results[0].name // ( inst name )

		if( inviter_iid == invited_iid ){
			return {
				success: false,
				msg: 'Inviting institution cannot be same as invited institution'
			}
		}

		const sql11 = 'SELECT id, name FROM institutions WHERE iid=?'
		const res11 = await pool.queryPromise( sql11, invited_iid )
		if( res11.error || !res11.results ){

			log('flag', 'failed to save contact, err: ', res11.error )

		}else if( !res11.results.length ){

			log('flag', 'failed to find recipient inst for: ', invited_iid )

		}else{

			invited_name = res11.results[0].name
			invited_id = res11.results[0].id

			const sql2 = 'INSERT INTO contacts (sender_key, sender_name, receiver_key, receiver_name) VALUES (?, ?, ?, ?)'
			const res2 = await pool.queryPromise( sql2, [ inviter_id, inviter_name, invited_id, invited_name  ] )
			if( res2.error || !res2.results ){
				log('flag', 'insert contact err:', res2 )
			}

		}

		///////////////// lookup invited email / send email

		// const sql3 = 'SELECT users.email FROM users INNER JOIN institutions ins ON ins.owner_key = users.id WHERE ins.iid = ? AND ins.confirmed=1 AND ins.published=1'
		const sql3 = 'SELECT users.email, users.name, users.surname FROM users INNER JOIN institutions ins ON ins.owner_key = users.id WHERE ins.iid = ? AND ins.confirmed=1 AND ins.published=1'

		const res3 = await pool.queryPromise( sql3, invited_iid )
		if( res3.error ){
			log('flag', 'contact err: ', res3.error )
			return { success: false }
		}

		if( !res3.results.length ){
			return {
				success: false,
				msg: 'Institution not found'
			}
		}

		invited_user_name = res3.results[0].name || ''
		inviter_user_name = request.session.USER.name || 'Someone'
		invited_email = res3.results[0].email || ''

		const msg_html = `Hello ${ invited_user_name },<br><br>${ request.session.USER.name + ( request.session.USER._surname ? ' ' + request.session.USER._surname : '' ) } from ${ inviter_name ? inviter_name : 'COIL Connect' } has sent you a message:<br><br>${ invitation }<br><br>Do not reply to this email<br><br>For privacy purposes, the sender does not yet know your email address.  Please email them at their email address:<br>${ inviter_email }<br><br>Thanks!<br>- COIL Connect VE`

		const info = await coilmail({
			from: env.mail_admin,
			to: invited_email,
			subject: 'A message from COIL Connect VE',
			html: msg_html,
			text: lib.format_strings( msg_html, {line_breaks: true} ),
		})

		const cc = await coilmail({
			from: env.mail_admin,
			to: request.session.USER.email,
			subject: '[COPY] A message from COIL Connect VE',
			html: msg_html,
			text: lib.format_strings( msg_html, {line_breaks: true} ),
		})

		return { 
			success: true,
			inviter_iid: inviter_iid,
		}

	}




}


module.exports = contact_inst