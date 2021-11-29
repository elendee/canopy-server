// const fs = require('fs')
// const lib = require('./lib.js')
const log = require('./log.js')
// const env = require('./.env.js')
const DB = require('./db.js')









const last_seen_check = async( request ) => {

	const pool = DB.getPool()

	const sql = 'SELECT * FROM bulletins WHERE 1 ORDER BY id DESC LIMIT 1'
	const res = await pool.queryPromise( sql )
	if( res.error ){
		log('flag', res.error )
		return false
	}

	const sql2 = 'SELECT last_seen_post FROM users WHERE id=?'
	const res2 = await pool.queryPromise( sql2, request.session.USER._id )
	if( res2.error ){
		log('flag', res2.error )
		return false
	}

	request.session.USER.update_visited('last_seen_post', request )
	.catch( err => {
		log('flag', 'err update_visited', err )
	})

	// log('flag', res.results, res2.results )

	return {
		success: true,
		new_posts: res.results[0].id > res2.results[0].last_seen_post
	}

}


const update_user_subbed = async( request ) => {

	const { settings } = request.body // course_id // subbed, 
	const { sub_general, sub_insts, sub_courses, sub_posts } = settings

	// log('flag', 'update', settings)

	request.session.USER._init_notify_settings = true
	// if( request.session.USER.has_inst ){
	// 	request.session.USER._init_notify_courses = true
	// }
	request.session.USER._sub_general = sub_general
	request.session.USER._sub_insts = sub_insts
	request.session.USER._sub_courses = sub_courses
	request.session.USER._sub_posts = sub_posts

	await request.session.USER.save()

	// const pool = DB.getPool()
	// const sql = 'UPDATE users SET is_subscribed=? WHERE email=?'
	// const res = await pool.queryPromise( sql, [ subbed, request.body.email ])
	// if( res.error ) return lib.return_fail( res.error, 'failed to update')
	// request.session.USER._is_subscribed = subbed
	// const res = await request.session.USER.save()

	// log('flag', 'saving', request.session.USER )
	// = new User( request.session.USER )

	return {
		success: true
	}

}





module.exports = {
	last_seen_check,
	update_user_subbed,
}



