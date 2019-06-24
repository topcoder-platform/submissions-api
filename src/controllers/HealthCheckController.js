/**
 * Health Check Controller
 */

const HealthCheckService = require('../services/HealthCheckService')
const { logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Get review
 * @param req the http request
 * @param res the http response
 */
function * check (req, res) {
  const result = yield HealthCheckService.check(req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

module.exports = {
  check
}
