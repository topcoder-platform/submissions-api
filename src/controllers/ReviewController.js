/**
 * Review Controller
 */

const ReviewService = require('../services/ReviewService')
const helper = require('../common/helper')

/**
 * Get review
 * @param req the http request
 * @param res the http response
 */
function * getReview (req, res) {
  res.json(yield ReviewService.getReview(req.authUser, req.params.reviewId))
}

/**
 * List reviews from ES
 * @param req the http request
 * @param res the http response
 */
function * listReviews (req, res) {
  const data = yield ReviewService.listReviews(req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Create review
 * @param req the http request
 * @param res the http response
 */
function * createReview (req, res) {
  res.json(yield ReviewService.createReview(req.authUser, req.body))
}

/**
 * Update review
 * @param req the http request
 * @param res the http response
 */
function * updateReview (req, res) {
  res.json(yield ReviewService.updateReview(req.authUser, req.params.reviewId, req.body))
}

/**
 * Patch review
 * @param req the http request
 * @param res the http response
 */
function * patchReview (req, res) {
  res.json(yield ReviewService.patchReview(req.authUser, req.params.reviewId, req.body))
}

/**
 * Delete review
 * @param req the http request
 * @param res the http response
 */
function * deleteReview (req, res) {
  yield ReviewService.deleteReview(req.params.reviewId)
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
