const _ = require('lodash')
const config = require('config')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_PROXY_SERVER_URL']))

/**
 * Function to get M2M token
 * @returns {Promise<string>}
 */
async function getM2Mtoken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

module.exports = {
  getM2Mtoken
}
