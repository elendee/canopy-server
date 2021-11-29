const log = require('./log.js')
const env = require('./.env.js')
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
	// host: 'mail.oko.nyc',
	host: env.MAIL_SERVER,
	service: env.MAIL_PROTOCOL,
	port: env.MAIL_PORT,
	secure: env.MAIL_SECURE,
	requireTLS: true,
	tls: {
		rejectUnauthorized: false
	},
	auth: {
		user: env.MAIL_ADMIN,
		pass: env.MAIL_PW
	}
})

const header = `<a href="${ env.SITE_URL }"><img src="${ env.SITE_URL }/resource/media/canopy-mail-header.png"></a><br>`

const canopymail = ( options, force, skip_report ) => {

	const opt = Object.assign( {}, options ) // prevent async accumulating !

	return new Promise((resolve, reject) => {

		opt.html = header + opt.html

		/////////////////////////// dev 
		if( !env.PRODUCTION && !force ){   // !env.ADMINS.includes( opt.from )
			log('mail', 'SKIPPING email (dev)', options )
			resolve({
				response: 'sent',
				accepted: [1],
			})
			return true
		}

		// if( force ) log('flag', 'caution: canopymail called with "force" option', opt.to, opt.subject )
		
		transporter.sendMail( opt, (error, info) => { 	
			if( error ){
				reject( error )
				return false
			}

			if( !skip_report ){

				if( env.PRODUCTION ){ /////////////////////////// production
					log('mail', 'email SENT: ', {
						from: opt.from,
						to: opt.to,
						subject: opt.subject,
						html: opt.html,
						// '( ' + opt.html.length + ' characters )',
						// text: '( ' + opt.text.length + ' characters )' 
					})

				}else{ /////////////////////////// local, other

					log('mail', 'email SENT: ', opt )

				}
			}

			resolve( info )

		})

	})

}

module.exports = {
	transporter,
	canopymail,
}