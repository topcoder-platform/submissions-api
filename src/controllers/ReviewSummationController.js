/**
 * ReviewSummation Controller
 */

const ReviewSummationService = require('../services/ReviewSummationService')

/**
 * Get review summation
 * @param req the http request
 * @param res the http response
 */
function * getReviewSummation (req, res) {
  res.json(yield ReviewSummationService.getReviewSummation(req.params.reviewSummationId))
}

/**
 * Create review summation
 * @param req the http request
 * @param res the http response
 */
function * createReviewSummation (req, res) {
  res.json(yield ReviewSummationService.createReviewSummation(req.authUser, req.body))
}

/**
 * Update review summation
 * @param req the http request
 * @param res the http response
 */
function * updateReviewSummation (req, res) {
  res.json(yield ReviewSummationService.updateReviewSummation(req.authUser, req.params.reviewSummationId, req.body))
}

/**
 * Patch review summation
 * @param req the http request
 * @param res the http response
 */
function * patchReviewSummation (req, res) {
  res.json(yield ReviewSummationService.patchReviewSummation(req.authUser, req.params.reviewSummationId, req.body))
}

/**
 * Delete review summation
 * @param req the http request
 * @param res the http response
 */
function * deleteReviewSummation (req, res) {
  yield ReviewSummationService.deleteReviewSummation(req.params.reviewSummationId)
  res.status(204).send()
}

module.exports = {
  getReviewSummation,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
