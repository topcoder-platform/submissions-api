/**
 * Review Controller
 */

const ReviewService = require('../services/ReviewService')
const { setPaginationHeaders, logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Get review
 * @param req the http request
 * @param res the http response
 */
function * getReview (req, res) {
  const result = yield ReviewService.getReview(req.authUser, req.params.reviewId, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * List reviews from ES
 * @param req the http request
 * @param res the http response
 */
function * listReviews (req, res) {
  const data = yield ReviewService.listReviews(req.query, req.span)
  setPaginationHeaders(req, res, data)
}

/**
 * Create review
 * @param req the http request
 * @param res the http response
 */
function * createReview (req, res) {
  const result = yield ReviewService.createReview(req.authUser, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Update review
 * @param req the http request
 * @param res the http response
 */
function * updateReview (req, res) {
  const result = yield ReviewService.updateReview(req.authUser, req.params.reviewId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Patch review
 * @param req the http request
 * @param res the http response
 */
function * patchReview (req, res) {
  const result = yield ReviewService.patchReview(req.authUser, req.params.reviewId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Delete review
 * @param req the http request
 * @param res the http response
 */
function * deleteReview (req, res) {
  yield ReviewService.deleteReview(req.params.reviewId, req.span)

  logResultOnSpan(req.span, httpStatus.NO_CONTENT)

  res.status(204).send()
}

module.exports = {
  getReview,
  listReviews,
  createReview,
  updateReview,
  patchReview,
  deleteReview
}
