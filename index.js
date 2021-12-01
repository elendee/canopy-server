
// NATIVE PACKAGES
const host = require('os').hostname()
const express = require('express')
const http = require('http')
const fs = require('fs')
// const path = require('path')
const os = require('os')

// LOCAL PACKAGES
const log = require('./utilities/log.js')
const DB = require('./persistent/db.js')
const env = require('./.env.js')
const lib = require('./utilities/lib.js')

// NPM 
const bodyParser = require('body-parser')
const session = require('express-session')
// const favicon = require('express-favicon')
const cookie = require('cookie')

const BROKER = require('./utilities/EventBroker.js')
// const FormData = require('express-form-data')

// const img_handler = require('./img_handler.js')



const User = require('./persistent/User.js')
// const MemoryStore = require('memorystore')(session)

const STORE = require('./memstore.js')



const GLOBAL_PUBLIC = require('./GLOBAL_PUBLIC.js')

const auth = require('./auth.js')

const OPS = require('./OPS.js')
// const SELECT = require('./SELECT.js')
const ADMIN = require('./ADMIN.js')

const gatekeep = require('./gatekeep.js')
// const readline = require('readline')

const render = require('./cano_html.js')

const WSS = require('./WSS.js')()

const GAME = require('./GAME.js')

const { response } = require('express')

// const mail = require('./mail.js')

// CACHED SESSIONS
const lru_session = session({
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 2 },
	resave: false,
	saveUninitialized: true,
	store: STORE,
	secret: env.SECRET
})






const exp = new express()

const server = http.createServer( exp )

// const upload = multer({
	// dest: env.UPLOAD_DIR
// })

// const FormData_options = {
// 	uploadDir: os.tmpdir(),
// 	autoClean: true
// }
// exp.use( FormData.parse( FormData_options ) )
// exp.use( FormData.format() )
 


// parse data with connect-multiparty. 
// delete from the request all empty files (size == 0)
// change the file objects to fs.ReadStream 
// exp.use( FormData.stream() )
// union the body and the files
// exp.use( FormData.union() )






// HTTP ROUTER
// exp.set( 'port', env.PORT )

// this is redundant, but demonstrates the options 
// - takes static file requests (that happen to begin with /client), serves them, and *rewrites them back again to '/client'
// .use( [virtual URL], [where to look for static assets] )
// also valid: .use([ where to look ]) - if you want to request static assets blindly, aka, mydomain.com/image.jpg

// hypothesis - this works locally but nginx handles on server

if( env.LOCAL ){
	exp.use('/js', express.static( env.PRIVATE_ROOT + '/client/js' )) 
	exp.use('/css', express.static( env.PRIVATE_ROOT + '/client/css' )) 
	exp.use('/resource', express.static( env.PRIVATE_ROOT + '/resource' ))
	exp.use('/three-patch', express.static( env.PRIVATE_ROOT + '/three-patch' ))
	exp.use('/fs', express.static( env.PRIVATE_ROOT + '/fs' )) // __dirname +	
}
 
exp.use( bodyParser.json({ 
	type: 'application/json' ,
	 limit: '1mb',
}))

exp.use( bodyParser.urlencoded({
	extended: true,
	limit: '1mb',
}))


exp.use( lru_session )

exp.use( gatekeep )

// get / page routing
exp.get('/', (request, response) => {
	response.send( render( 'index', request ) )
})

exp.get('/login', (request, response) => {
	response.send( render( 'login', request ) )
})

exp.get('/register', (request, response) => {
	response.send( render( 'register', request ) )
})

exp.get('/account', (request, response) => {
	response.send( render('account', request, '' ))
})

exp.get('/world', (request, response) => {
	response.send( render('world', request, '' ))
})

exp.get('/logout', ( request, response ) => {
	auth.logout_user( request )
	.then( res => {
		response.send( render('redirect', request, '' ))
	}).catch( err => {
		log('flag', 'err logging out: ', err )
		response.send( render('account', request, '' ))
	})
})

exp.get('/forbidden', ( request, response ) => {
	response.send( render('forbidden', request, '' ))
})

exp.get('/admin', (request, response) => {
	if(  lib.is_admin( request ) ){ // env.DEV ||
		response.send( render( 'admin', request ) )
	}else{
		response.send( render( 'redirect', request, '' ) )
	}
})

exp.get('/send_reset', (request, response) => {
	response.send( render( 'send_reset', request ))
})

exp.get('/reset', (request, response) => { // only GET with callback because of query params..=> .
	response.send( render( 'reset', request ))
})

exp.get('/bulletin_board', (request, response) => { // only GET with callback because of query params..=> .
	OPS.bulletin_board( request )
	.then( res => {
		response.json( res )
	})
	.catch( err => { log('flag', 'err bulletin_board: ', err ) })
})

exp.get('/await_confirm', (request, response) => {
	response.send( render( 'await_confirm', request ) )
})

exp.get('/global_public', ( request, response )=> {
	response.json( GLOBAL_PUBLIC )
})

exp.get('/surveys', ( request, response )=> {
	response.send( render( 'surveys', request ) )
})


exp.get('/_storage/mysqldumps/*', (request, response) => {
	// 
	if( !lib.is_admin( request )){
		return response.send( render('redirect', request, ''))
	}
	try{
		response.sendFile( request.path, { root: env.PRIVATE_ROOT } )
	}catch( e ){
		log('flag', e )
		return response.send( render('redirect', request, '404'))
	}
})

exp.get('/dev', (request, response) => {
	if( env.LOCAL ){
	
		heap()

		response.json({
			success: true
		})
	}else{
		response.json({
			success: false
		})	
	}
})


exp.get('/process_confirm', ( request, response ) => {
	response.send( render( 'process_confirm', request ) )
})

// exp.get('/temp/emails.csv', ( request, response ) => {
exp.get('/temp/*.csv', ( request, response ) => {
	if( lib.is_admin( request ) ){
		// '/temp/emails.csv'
		response.sendFile( request.path, { root: '/' } )
	}else{
		response.send( render('404', request, '') )
	}
})












// post routes

// account posts 

exp.post('/register', ( request, response ) => {
	auth.register_user( request )
	.then( res => {
		response.json( res )
	}).catch( err => {
		log('flag', 'err register: ', err )
		response.json({
			success: false,
			msg: 'error registering'
		})
	})
})

exp.post('/login', ( request, response ) => {
	auth.login_user( request )
	.then( res => {
		response.json( res )
	}).catch( err => {
		log('flag', err )
		response.json({
			success: false,
			msg: 'error logging in'
		})
	})
})

exp.post('/send_reset', ( request, response ) => {
	auth.send_reset( request )
	.then( res => {
		response.json( res )
	}).catch( err => {
		log('flag', err )
		response.json({
			success: false,
			msg: 'error sending reset'
		})
	})
})

exp.post('/reset', function( request, response ){
	auth.reset_pass( request )
	.then( res => {
		if( !res.success ){
			log('flag', 'err resetting password: ', res, request.session.USER.email )
		}
		// includes success false's :
		response.json( res )
	}).catch( err => {
		log('flag', 'err reset pw: ', err )
		response.json({
			success: false,
			msg: 'reset password error'
		})
	})
})

exp.post('/confirm_account', function( request, response ){
	auth.confirm_account( request, STORE )
	.then( res => {
		// includes success false's :
		response.json( res )
	}).catch( err => {
		log('flag', 'err confirm account: ', err )
		response.json({
			success: false,
			msg: 'confirm account error'
		})
	})
})

exp.post('/logout_user', function( request, response ){
	auth.logout_user( request )
	.then( res => {
		response.json( res )
	}).catch( err => {
		log('flag', 'err logout: ', err )
		response.json({
			success: false,
			msg: 'error logging out'
		})
	})
})



// institution posts


exp.post('/send_confirm_mail', function( request, response ){
	auth.send_confirm_mail( request.session.USER, null )
	.then( res => {
		response.json( res )
	}).catch( err => {
		log('flag', 'err sending confirm: ', err )
		response.json({
			success: false,
			msg: 'error sending confirm'
		})
	})
})

exp.post('/delete_user', ( request, response ) => {
	ADMIN.delete_user( request, request.body.is_admin )
	.then( res => {
		// includes success false's :
		response.json( res )
	}).catch( err => {
		log('flag', 'err delete user: ', err )
		response.json({
			success: false,
			msg: 'unable to delete user'
		})
	})
})

exp.post('/last_seen_check', ( request, response ) => {
	OPS.last_seen_check( request )
	.then( res => {
		response.json( res )	
	}).catch( err => {
		log('flag', 'last_seen_check err: ', err )
		response.json({ success: false, msg: 'err last_seen_check' })
	})
})

exp.post('/db_backup', ( request, response ) => {
	ADMIN.db_backup( request )
	.then( res => {
		response.json( res )	
	}).catch( err => {
		log('flag', 'db_backup err: ', err )
		response.json({ success: false, msg: 'err db_backup' })
	})
})

// exp.post('/img_handler', (request, response) => {
// 	img_handler( request )
// 	.then( res => {
// 		response.send( res )
// 	})
// 	.catch( err => {
// 		log('flag', 'upload err : ', err )
// 		response.send({
// 			success: false,
// 			msg: 'upload fail',
// 		})
// 	})

// })



// new posts

exp.post('*', function(request, response){
	log('router', '404 POST: ' + request.url )
	response.json({
		success: false,
		msg: '404',
	})
})

exp.get('*', function(request, response){
	log('router', '404 GET: ' + request.url)
	response.send( render( '404', request, '' ))	
	
})















function heartbeat(){
	// DO NOT convert to arrow function or else your sockets will silently disconnect ( no "this" )
	this.isAlive = Date.now()
}




DB.initPool(( err, pool ) => {

	if( err ) return console.error( 'no db: ', err )
	
	log('db', 'init:', Date.now() )
  
	server.listen( env.PORT, function() {
		log('boot', `\n
//////// ------ ///////
///////  CANOPY ///////
//////// ------ ///////
port: ${ env.PORT }
root: ${ env.root }
production: ${ env.PRODUCTION }
dev: ${ env.DEV }
local: ${ env.LOCAL }
`)
	})


	server.on('upgrade', function( request, socket, head ){

		lru_session( request, {}, () => {

			// log('flag', JSON.stringify( request.session ).length )

			log('wss', 'session parsed')

			WSS.handleUpgrade( request, socket, head, function( ws ) {
				WSS.emit('connection', ws, request )
			})
		})
	})

	WSS.on('connection', function connection( socket, req ) {

		log('wss', 'connection: ', lib.identify( req.session.USER ) )

		socket.request = req

		socket.isAlive = socket.isAlive || true

		socket.bad_packets = 0

		socket.on('pong', heartbeat )

		if( WSS.clients.size > env.MAX_USERS ) {
			return lib.return_fail_socket( socket, 'sorry, game is at capacity')
		}

		GAME.init_user( socket )
		.then( res => {
			if( res && res.success ){
				socket.send( JSON.stringify({
					type: 'private_init_world',
					canopy: res.canopy,					
				}))
			}else{
				socket.send(JSON.stringify({
					type: 'hal',
					subtype: 'error',
					msg: 'error initializing',											
				}))
				log('flag', 'err init user: ', res )
			}

		})
		.catch( err => {
			log('flag', 'init entry err', err )
		})

	}) // wss connection

}) // initPool







function heap(){
	const mem = process.memoryUsage()
	for (const key in mem) {
		console.log(`${key} ${Math.round(mem[key] / 1024 / 1024 * 100) / 100} MB`);
	}
}




// any testing needed
;(async() => {

	if( !env.LOCAL || 1 ) return

	const pool = DB.getPool()
	const sql = 'SELECT * FROM users WHERE email=?'
	const res = await pool.queryPromise( sql, 'testuser' )

	const testuser = new User( res.results[0] )

	const save = await testuser.save()

})()
.catch( err => {
	log('flag', 'test err', err )
});



module.exports = {}