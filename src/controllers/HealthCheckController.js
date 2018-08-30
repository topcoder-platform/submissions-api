/**
 * Health Check Controller
 */

const HealthCheckService = require('../services/HealthCheckService')

/**
 * Get review
 * @param req the http request
 * @param res the http response
 */
function * check (req, res) {
  res.json(yield HealthCheckService.check())
}

module.exports = {
  check
}
