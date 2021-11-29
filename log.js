
const env = require('./.env.js')

const active = env.ACTIVE

const timestamp = true
let d 
let dstring = ''


const log = function( type, msg, ...data ){

	if( type === 'gatekeep' ){
		// console.log( type )
		let skipper
		for( const pattern of env.NO_LOG || [] ){
			skipper = new RegExp( pattern, 'i' )
			if( data[0].match( skipper ) ){
				// console.log('SKIPPIN', data[0])
				return 
			}
		}
	}

	if( msg && msg === 'SKIPLOG') return false
	
	if( timestamp ) {
		d = new Date()
		// dstring = '(' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + ')'
		dstring = new Date().toString().substr(0, 33)
	}

	data = data || ''
	let c = 0
	if( active[ type ] ){
		let color = ''
		let pre = ''
		for( t in active ) {
			c++
			if( t == type ){
				color = colors_fg[ c % colors_fg.length ]
			}
		}
		if( type == 'flag' ) pre = '!!! '
		console.log( '\x1b[100m\x1b[30mlog\x1b[0m' + color + '@' + type + '\x1b[0m' + ': ' + pre + dstring, msg, ...data )
	}
}


module.exports = log





var colors_fg = [
// "\x1b[0m", RESET
	'\x1b[1m',
	'\x1b[2m',
	// "\x1b[4m", UNDERSCORE
	// "\x1b[5m", BLINK
	// "\x1b[7m", REVERSE
	// "\x1b[8m", HIDDEN
	// "\x1b[30m", BLACK FG
	'\x1b[31m',
	'\x1b[32m',
	'\x1b[33m',
	'\x1b[34m',
	'\x1b[35m',
	'\x1b[36m',
	'\x1b[37m'
]


var colors_bg = [
	'\x1b[40m',
	// "\x1b[41m", RED bg
	'\x1b[42m',
	'\x1b[43m',
	'\x1b[44m',
	'\x1b[45m',
	'\x1b[46m',
	// "\x1b[47m", LIGHT GREY BG
	'\x1b[100m',
	'\x1b[101m',
	'\x1b[102m',
	'\x1b[103m',
	'\x1b[104m',
	'\x1b[105m',
	'\x1b[106m',
	// "\x1b[107m" WHITE BG

]


log( 'call', 'log.js' )
