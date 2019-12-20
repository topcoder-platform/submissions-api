/**
 * ReviewSummation Controller
 */

const ReviewSummationService = require('../services/ReviewSummationService')
const { setPaginationHeaders, logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Get review summation
 * @param req the http request
 * @param res the http response
 */
function * getReviewSummation (req, res) {
  const result = yield ReviewSummationService.getReviewSummation(req.params.reviewSummationId, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * List Review Summations from ES
 * @param req the http request
 * @param res the http response
 */
function * listReviewSummations (req, res) {
  const data = yield ReviewSummationService.listReviewSummations(req.query, req.span)
  setPaginationHeaders(req, res, data)
}

/**
 * Create review summation
 * @param req the http request
 * @param res the http response
 */
function * createReviewSummation (req, res) {
  const result = yield ReviewSummationService.createReviewSummation(req.authUser, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Update review summation
 * @param req the http request
 * @param res the http response
 */
function * updateReviewSummation (req, res) {
  const result = yield ReviewSummationService.updateReviewSummation(req.authUser, req.params.reviewSummationId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Patch review summation
 * @param req the http request
 * @param res the http response
 */
function * patchReviewSummation (req, res) {
  const result = yield ReviewSummationService.patchReviewSummation(req.authUser, req.params.reviewSummationId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Delete review summation
 * @param req the http request
 * @param res the http response
 */
function * deleteReviewSummation (req, res) {
  yield ReviewSummationService.deleteReviewSummation(req.params.reviewSummationId, req.span)

  logResultOnSpan(req.span, httpStatus.NO_CONTENT)

  res.status(204).send()
}

module.exports = {
  getReviewSummation,
  listReviewSummations,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
