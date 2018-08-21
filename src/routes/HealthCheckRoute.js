/**
 * Review API Routes
 */

module.exports = {
  '/health': {
    get: {
      controller: 'HealthCheckController',
      method: 'check'
    }
  }
}
