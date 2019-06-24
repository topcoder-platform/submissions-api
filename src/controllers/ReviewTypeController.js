/**
 * ReviewType Controller
 */

const ReviewTypeService = require('../services/ReviewTypeService')
const { setPaginationHeaders, logResultOnSpan } = require('../common/helper')
const httpStatus = require('http-status')

/**
 * Get review type
 * @param req the http request
 * @param res the http response
 */
function * getReviewType (req, res) {
  const result = yield ReviewTypeService.getReviewType(req.params.reviewTypeId, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * List review types from ES
 * @param req the http request
 * @param res the http response
 */
function * listReviewTypes (req, res) {
  const data = yield ReviewTypeService.listReviewTypes(req.query, req.span)
  setPaginationHeaders(req, res, data)
}

/**
 * Create review type
 * @param req the http request
 * @param res the http response
 */
function * createReviewType (req, res) {
  const result = yield ReviewTypeService.createReviewType(req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Update review type
 * @param req the http request
 * @param res the http response
 */
function * updateReviewType (req, res) {
  const result = yield ReviewTypeService.updateReviewType(req.params.reviewTypeId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Patch review type
 * @param req the http request
 * @param res the http response
 */
function * patchReviewType (req, res) {
  const result = yield ReviewTypeService.patchReviewType(req.params.reviewTypeId, req.body, req.span)

  logResultOnSpan(req.span, httpStatus.OK, result)

  res.json(result)
}

/**
 * Delete review type
 * @param req the http request
 * @param res the http response
 */
function * deleteReviewType (req, res) {
  yield ReviewTypeService.deleteReviewType(req.params.reviewTypeId, req.span)

  logResultOnSpan(req.span, httpStatus.NO_CONTENT)

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
