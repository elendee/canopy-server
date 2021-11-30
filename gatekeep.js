// const env = require('./.env.js')
const color = require('./color.js')

const lib = require('./lib.js')
const log = require('./log.js')

const User = require('./persistent/User.js')

const render = require('./cano_html.js')

const ROUTES = {

	GET: {
		logged_routes: [
			'account', 
			'admin', 
		],
		user_routes: [
			'',
			'register', 
			'login', 
			'account', 
			'admin',
		],
		resource_routes: [
			'fs',
			'resource', 
			// 'client', 
			'favicon',
			'css',
			'js',
		],
		pings: [
			//
		]
	},

	POST: {
		logged_routes: [
			'edit_account',
			'last_seen_check',
			'db_backup',
			'delete_user',
			'send_confirm_mail',
		],
		// admin_routes: [],
		user_routes: [
			'login', 
			'register',
		],
		resource_routes: [],
	}

}

let regex
const route_check = ( routes, path ) => { 
	for( const route of routes ){
		regex = new RegExp( '^/' + route )
		if( path.match( regex ) ){
			return true
		}
	}
	return false
}


module.exports = gatekeep = function( req, res, next ) {

	ip = ( req.headers['x-forwarded-for'] || req.connection.remoteAddress || '' ).split(',')[0].trim()



	// skip resources completely - nginx should do this anyway
	if( req.method.match(/get/i) && route_check( ROUTES.GET.resource_routes, req.path ) ){ // skip resource requests..
		return next()
	}



	if( req.method == 'GET' ){

		if( route_check( ROUTES.GET.logged_routes, req.path ) ){

			log('gatekeep_trace', 'get logged_routes', req.path)

			if( !lib.is_logged( req ) ){

				log('gatekeep', format({
					ip: ip,
					method: req.method,
					path: req.path,
					email: '(forbidden)',
				}), req.path )

				return res.send( render('redirect', req, 'forbidden'))//.end()

			}

			req.session.USER = new User( req.session.USER )

			// log('flag', 'new register should be here A')

			if( lib.is_logged( req ) ){

				// log('flag', 'new register should be here B')

				const limbo_paths = ['await_confirm', 'redirect']

				if( !req.session.USER._confirmed && !route_check( limbo_paths, req.path ) ){

					// log('flag', 'new register should be here C')

					log('flag', 'redirecting to /await_confirm from path: ', req.path )

					return res.send( render('redirect', req, 'await_confirm') )

				}

			}

			// update_visited( req )

			log('gatekeep', format({
				ip: ip,
				method: req.method,
				path: req.path,
				email: req.session.USER.email,
			}), req.path )

			return next()

		}else if( route_check( ROUTES.GET.user_routes, req.path )){

			log('gatekeep_trace', 'get user_routes', req.path)

			req.session.USER = new User( req.session.USER )

			log('gatekeep', format({
				ip: ip,
				method: req.method,
				path: req.path,
				email: req.session.USER.email,
			}), req.path )

			return next()

		}

	}





	if( req.method === 'POST' ){

		if( route_check( ROUTES.POST.logged_routes, req.path ) ){

			log('gatekeep_trace', 'post logged route', req.path )

			if( !lib.is_logged( req )){

				return lib.return_fail( 'unlogged post', 'must be logged in')

			}

			req.session.USER = new User( req.session.USER )

		}else if( route_check( ROUTES.POST.user_routes, req.path ) ){

			log('gatekeep_trace', 'post user route', req.path )

			req.session.USER = new User( req.session.USER )

		}

		log('gatekeep', format({
			ip: ip,
			method: req.method,
			path: req.path,
			email: req.session.USER.email,
		}), req.path )

		next()

	}




}







const skiplog_routes = ['/bulletin_board', '/check_pending']

function format( data ){
	if( data.path && skiplog_routes.includes( data.path ) ) return 'SKIPLOG'
	return ` ${ color('orange', data.ip ) } ${ color_route( data.method, data.path ) } ${ data.email ? color('magenta', data.email ) : 'none' }`

}


function color_route( method, data ){
	return color( ( method === 'POST' ? 'lblue' : 'blue' ), data )
}
