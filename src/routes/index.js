/**
 * Defines the API routes
 */

const _ = require('lodash')
const ReviewTypeRoutes = require('./ReviewTypeRoutes')
const SubmissionRoutes = require('./SubmissionRoutes')
const ReviewRoutes = require('./ReviewRoutes')
const ReviewSummationRoutes = require('./ReviewSummationRoutes')
const HealthCheck = require('./HealthCheckRoute')

module.exports = _.extend({},
  ReviewTypeRoutes,
  SubmissionRoutes,
  ReviewRoutes,
  ReviewSummationRoutes,
  HealthCheck
)
