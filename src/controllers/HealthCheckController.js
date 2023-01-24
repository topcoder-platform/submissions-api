/**
 * Health Check Controller
 */

const HealthCheckService = require('../services/HealthCheckService')

/**
 * Get review
 * @param req the http request
 * @param res the http response
 */
async function check(req, res) {
  res.json(await HealthCheckService.check())
}

module.exports = {
  check
}
