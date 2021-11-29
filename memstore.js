const session = require('express-session')
const MemoryStore = require('memorystore')(session)

const STORE = new MemoryStore({
	checkPeriod: 1000 * 60 * 60 * 24 * 2// prune expired entries every 24h
})

module.exports = STORE