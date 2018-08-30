/**
 * ReviewType Controller
 */

const ReviewTypeService = require('../services/ReviewTypeService')
const helper = require('../common/helper')

/**
 * Get review type
 * @param req the http request
 * @param res the http response
 */
function * getReviewType (req, res) {
  res.json(yield ReviewTypeService.getReviewType(req.params.reviewTypeId))
}

/**
 * List review types from ES
 * @param req the http request
 * @param res the http response
 */
function * listReviewTypes (req, res) {
  const data = yield ReviewTypeService.listReviewTypes(req.query)
  helper.setPaginationHeaders(req, res, data)
}

/**
 * Create review type
 * @param req the http request
 * @param res the http response
 */
function * createReviewType (req, res) {
  res.json(yield ReviewTypeService.createReviewType(req.body))
}

/**
 * Update review type
 * @param req the http request
 * @param res the http response
 */
function * updateReviewType (req, res) {
  res.json(yield ReviewTypeService.updateReviewType(req.params.reviewTypeId, req.body))
}

/**
 * Patch review type
 * @param req the http request
 * @param res the http response
 */
function * patchReviewType (req, res) {
  res.json(yield ReviewTypeService.patchReviewType(req.params.reviewTypeId, req.body))
}

/**
 * Delete review type
 * @param req the http request
 * @param res the http response
 */
function * deleteReviewType (req, res) {
  yield ReviewTypeService.deleteReviewType(req.params.reviewTypeId)
  res.status(204).send()
}

module.exports = {
  getReviewType,
  listReviewTypes,
  createReviewType,
  updateReviewType,
  patchReviewType,
  deleteReviewType
}
