/**
 * Defines the API routes
 */

const _ = require('lodash')
const ReviewTypeRoutes = require('./ReviewTypeRoutes')
const SubmissionRoutes = require('./SubmissionRoutes')

module.exports = _.extend({}, ReviewTypeRoutes, SubmissionRoutes)
