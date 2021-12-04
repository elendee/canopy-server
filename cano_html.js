
const lib = require('./utilities/lib.js')

const env = require('./.env.js')
const log = require('./utilities/log.js')
const GLOBAL = require('./GLOBAL_PUBLIC.js')

const { request } = require('express')

let header_info = `
	<title>${ env.SITE_TITLE }</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1">
	<meta name="Description" content="${ env.SITE_TITLE }">
	<meta property="og:url" content="${ env.SITE_URL }">
	<meta property="og:title" content="${ env.SITE_TITLE }">
	<meta property="og:description" content="${ env.SITE_DESC }"> 
	<meta property="og:image" content="${ env.SITE_IMAGE }"/>
	<link rel="shortcut icon" href="/resource/media/favicon.ico">
	<script>
		// var cache_bust = 26
	</script>
`

const overlays = {
	global: `<div id='site-data'>${ JSON.stringify( GLOBAL )}</div>`,
}


const footer = request => {
	return `
	<div id='footer'>
	</div>`
}



const scripts = {
	index: `<script type='module' src='/js/routing/init_index.js' defer='defer'></script>`,
	account: `<script type='module' src='/js/routing/init_account.js' defer='defer'></script>`,
	admin: `<script type='module' src='/js/routing/init_admin.js' defer='defer'></script>`,
	upload: `<script type='module' src='/js/routing/init_upload.js' defer='defer'></script>`,
	await_confirm: `<script type='module' src='/js/routing/init_await_confirm.js' defer='defer'></script>`,
	auth: `<script type='module' src='/js/routing/init_auth.js' defer='defer'></script>`,
	world: `<script type='module' src='/js/routing/init_world.js' defer='defer'></script>`,
	send_reset: `<script type='module' src='/js/routing/init_send-reset.js' defer='defer'></script>`,
	redirect: `<script type='module' src='/js/routing/init_redirect.js' defer='defer'></script>`,
	process_confirm: `<script type='module' src='/js/routing/init_process-confirm.js' defer='defer'></script>`,
	'404': `<script type='module' src='/js/routing/init_404.js' defer='defer'></script>`,
}

const styles = {
	base: `<link rel='stylesheet' href='/css/base.css'>`,
	modals: `<link rel='stylesheet' href='/css/modals.css'>`,
	index: `<link rel='stylesheet' href='/css/index.css'>`,
	account: `<link rel='stylesheet' href='/css/account.css'>`,
	admin: `<link rel='stylesheet' href='/css/admin.css'>`,
	auth: `<link rel='stylesheet' href='/css/auth.css'>`,
	world: `<link rel='stylesheet' href='/css/world.css'>`,
	'404': `<link rel='stylesheet' href='/css/404.css'>`,
	// privacy: `<div id='form-privacy'><div class='privacy-content'><div class='alert-close'>&times;</div>privacy alert here....</div></div>`
}






const render = function( type, request, data ){

	let css_includes = styles.base + styles.modals
	let js_includes = ''

	let header

	try{

		switch( type ){

			case 'index':

				// css_includes += styles.index 
				js_includes += scripts.index 

				return `<html>
				<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							<div id='index'>
								<a href='/world'>Enter world</a>
							</div>
						</div>
						${ footer( request ) }
					</body>
				</html>`


			case 'account':

				css_includes += styles.account
				js_includes += scripts.account 

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							<h2 class='page-title'>Account</h2>
							<div id='account'>
								<div class='stat-row'>
									<span class='stat'>email: ${ request.session.USER.email }</span>
								</div>
							</div>

						</div>
						${ footer( request ) }
					</body>
				</html>`

			case 'upload':

				js_includes += scripts.upload

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							<form id='j-upload' class='script-upload' data-upload-type='ja-script'>
								<h4>snagglytooth script</h4>
								<input type='file'>
								<input type='submit' class='button' value='snaggle'>
							</form>
							<form id='o-upload' class='script-upload' data-upload-type='ok-script'>
								<h4>hufflepuff script</h4>
								<input type='file'>
								<input type='submit' class='button' value='huffle'>
							</form>
						</div>
					</body>
				</html>`				
				break;

			case 'redirect':

				js_includes += scripts.redirect

				log('router', 'redirecting: ', data )

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						<div id='redirect' data-redirect='${ data }'>
						</div>
					</body>
				</html>`

			case 'admin':

				css_includes += styles.admin
				js_includes += scripts.admin 

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
						admin....
						</div>
						${ footer( request ) }
					</body>
				</html>`

			case 'login':

				js_includes += scripts.auth
				css_includes += styles.auth

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							<h2 class='page-title'>Login</h2>
							<form id='login' class='auth-form'>
								<input type='email' id='email' placeholder='email'>
								<input type='password' id='password' placeholder='password' autocomplete='off'>
								<input type='submit' class='button' value='login'>
							</form>
							<p>
								<div id='forgot'>
									<a class='subauth-button' href='/send_reset'>Send a reset</a>
								</div>
							</p>
							<p>
								Need an account?  <a class='subauth-button' href='/register'>Register here</a>
							</p>
						</div>
					</body>
				</html>`

			case 'register':

				js_includes += scripts.auth
				css_includes += styles.auth

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							<h2 class='page-title'>Register</h2>
							<form id='register' class='auth-form'>
								<input type='text' id='handle' placeholder='handle' autocomplete='off'>
								<input type='email' id='email' placeholder='email' autocomplete='off'>
								<br>
								</select>
								<input type='password' id='password' placeholder='password' autocomplete='new-password'>
								<br>
								<input type='submit' class='button' value='register'>
							</form>

						</div>
						${ footer( request ) }
					</body>
				</html>`

			case 'send_reset':

				js_includes += scripts.send_reset
				css_includes += styles.auth

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ build_header( request ) }
						<div id='content'>
							<h2 class='page-title'>Send Password Reset Link</h2>
							<form id='reset' method='get' class='auth-form'>
								<input id='reset-email' type='email' placeholder='email'>
								<input type='submit' class='button' value='reset'>
							</form>
						</div>
						${ footer( request ) }
					</body>
				</html>`
			
			case 'reset':

				js_includes += scripts.reset

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ build_header( request ) }
						<div id='content'>
							<h2 class='page-title'>Reset</h2>
							<p id='reset-indicator'>
							</p>
							<form id='reset' method='get'>
								<input id='new-password' type='password' placeholder='new password'>
								<input id='confirm-password' type='password' placeholder='confirm password'>
								<input type='submit' class='button' value='reset'>
							</form>

						</div>
						${ footer( request ) }
					</body>
				</html>`


			case 'world':

				js_includes += scripts.world
				css_includes += styles.world

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						<div id='content'>
						</div>
						${ footer( request ) }
					</body>
				</html>`






			case 'forbidden':

				// js_includes += scripts.default

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ build_header( request ) }
						<div id='content'>
							<p>
								You must be logged in to view this page
							</p>
							<div class='back-link button'>
								back
							</div>
						</div>
						${ footer( request ) }
					</body>
				</html>`

			

			case 'await_confirm':

				css_includes += styles.auth
				js_includes += scripts.await_confirm

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ build_header( request ) }
						<div id='content'>
							<h2>Awaiting confirmation</h2>
							<p>
								There should be a link awaiting you in your email.
							</p>
							<p>
								Links are valid for ${ env.CONFIRM_MINUTES } minutes.
							</p>
							<div id='resend-confirm'>
								<div class='button'>
									Send me a new link
								</div>
							</div>
							
						</div>
						${ footer( request ) }
					</body>
				</html>`

			case 'process_confirm':
				// css_includes += styles.page_editors
				js_includes += scripts.process_confirm

				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ overlays.global }
						${ build_header( request ) }
						<div id='content'>
							processing confirmation...
						</div>
						${ footer( request ) }
					</body>
				</html>`

			default: 

				css_includes += styles['404']
				js_includes += scripts['404']
				return `<html>
					<head>
						${ header_info }
						${ css_includes }
						${ js_includes }
					</head>
					<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
						${ build_header( request ) }
						<div id='content'>
							<div>
								<p>
									Page not found
								</p>
								<p>
									<a href='/'>back to dry land</a>
								</p>
							</div>
						</div>
						${ footer( request ) }
					</body>
				</html>`

		}

	}catch( e ){

		log('flag', 'compile err; ', e )

		return `
		<html>
			<head>
				${ header_info }
				${ css_includes }
				${ js_includes }
			</head>
			<body class='${ type }' data-logged='${ lib.is_logged( request )}'>
				${ overlays.global }
				${ header }
				<div id='content'>
					Server error compiling page
				</div>
				${ footer( request ) }
			</body>
		</html>`

	}

} // render



const build_links = request => {

	let base = `
		<div class='nav-link'>
			<a href='/world'>world</a>
		</div>`

	if( lib.is_logged( request )){
		base += `
		<div class='nav-link'>
			<a href='/account'>account</a>
		</div>
		<div class='nav-link'>
			<a href='/logout'>logout</a>
		</div>
		`
	}else{
		base += `
		<div class='nav-link'>
			<a href='/login'>login</a>
		</div>
		<div class='nav-link'>
			<a href='/register'>register</a>
		</div>
		`
	}

	return base

}


const build_header = request => {
	return `
	<div id='header'>
		<div id='logo'>
			<a href='${ env.SITE_PUBLIC_ROOT }'>
				<img src='/resource/media/logo.png'>
			</a>
		</div>
		<div id='nav-links'>
			${ build_links( request )}
		</div>
	</div>
	`
}


module.exports = render
