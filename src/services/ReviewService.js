/**
 * Review Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const logger = require('winston')

const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const {
  originator, mimeType, events
} = require('../../constants').busApiMeta
const HelperService = require('./HelperService')
const SubmissionService = require('./SubmissionService')

const table = 'Review'

/**
 * Function to get review based on ID from DynamoDB
 * This function will be used all by other functions to check existence of review
 * @param {Number} reviewId reviewId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * _getReview (reviewId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      'id': reviewId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get review based on ID from ES
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be found
 * @return {Object} Data found from database or ES
 */
function * getReview (authUser, reviewId) {
  let review
  const response = yield helper.fetchFromES({
    id: reviewId
  }, helper.camelize(table))

  if (response.total === 0) {
    logger.info(`Couldn't find review ${reviewId} in ES. Checking db`)
    review = yield _getReview(reviewId)
    logger.debug(`Review: ${review}`)

    if (!review) {
      throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
    }
  } else {
    review = response.rows[0]
  }

  // Fetch submission without review and review summations
  const submission = yield SubmissionService._getSubmission(review.submissionId, false)
  logger.info('Check User access before returning the review')
  yield helper.checkReviewGetAccess(authUser, submission)
  // Return the review
  return review
}

getReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi.string().uuid().required()
}

/**
 * Function to list reviews from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
function * listReviews (query) {
  return yield helper.fetchFromES(query, helper.camelize(table))
}

const listReviewsQuerySchema = {
  score: joi.score(),
  typeId: joi.string().uuid(),
  reviewerId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  scoreCardId: joi.id(),
  submissionId: joi.string().uuid(),
  status: joi.reviewStatus(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder()
}

listReviewsQuerySchema.sortBy = joi.string().valid(_.difference(
  Object.keys(listReviewsQuerySchema),
  ['page', 'perPage', 'orderBy']
))

listReviews.schema = {
  query: joi.object().keys(listReviewsQuerySchema).with('orderBy', 'sortBy')
}

/**
 * Function to create review in database
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createReview (authUser, entity) {
  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  const item = _.extend({
    'id': uuid(),
    'created': currDate,
    'updated': currDate,
    'createdBy': authUser.handle || authUser.sub,
    'updatedBy': authUser.handle || authUser.sub
  }, entity)

  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  yield dbhelper.insertRecord(record)

  // Push Review created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.create,
    'originator': originator,
    'timestamp': currDate, // time when submission was created
    'mime-type': mimeType,
    'payload': _.extend({
      'resource': helper.camelize(table)
    }, item)
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReview.schema = {
  authUser: joi.object().required(),
  entity: joi.object().keys({
    score: joi.score().required(),
    typeId: joi.string().uuid().required(),
    reviewerId: joi.alternatives()
      .try(joi.id(), joi.string().uuid()).required()
      .error(errors => ({message: '"reviewerId" must be a number or a string'})),
    scoreCardId: joi.id().required(),
    submissionId: joi.string().uuid().required(),
    status: joi.reviewStatus().required(),
    metadata: joi.object()
  }).required()
}

/*
 * Function to update review in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
function * _updateReview (authUser, reviewId, entity) {
  const exist = yield _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
  }

  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      'id': reviewId
    },
    UpdateExpression: `set score = :s, scoreCardId = :sc, submissionId = :su,
                        typeId = :t, reviewerId = :r,
                        updated = :ua, updatedBy = :ub`,
    ExpressionAttributeValues: {
      ':s': entity.score || exist.score,
      ':sc': entity.scoreCardId || exist.scoreCardId,
      ':su': entity.submissionId || exist.submissionId,
      ':t': entity.typeId || exist.typeId,
      ':r': entity.reviewerId || exist.reviewerId,
      ':ua': currDate,
      ':ub': authUser.handle || authUser.sub
    }
  }

  // If metadata exists, add it to the update expression
  if (entity.metadata || exist.metadata) {
    record['UpdateExpression'] = record['UpdateExpression'] + `, metadata = :ma`
    record['ExpressionAttributeValues'][':ma'] = _.merge({}, exist.metadata, entity.metadata)
  }

  yield dbhelper.updateRecord(record)

  // Push Review updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.update,
    'originator': originator,
    'timestamp': currDate, // time when submission was updated
    'mime-type': mimeType,
    'payload': _.extend({
      'resource': helper.camelize(table),
      'id': reviewId,
      'updated': currDate,
      'updatedBy': authUser.handle || authUser.sub
    }, entity)
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity, {
    'updated': currDate,
    'updatedBy': authUser.handle || authUser.sub
  })
}

/**
 * Function to update review in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
function * updateReview (authUser, reviewId, entity) {
  return yield _updateReview(authUser, reviewId, entity)
}

updateReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi.string().uuid().required(),
  entity: joi.object().keys({
    score: joi.score().required(),
    typeId: joi.string().uuid().required(),
    reviewerId: joi.alternatives().try(joi.id(), joi.string().uuid()).required(),
    scoreCardId: joi.id().required(),
    submissionId: joi.string().uuid().required(),
    status: joi.reviewStatus().required(),
    metadata: joi.object()
  }).required()
}

/**
 * Function to patch review in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewId reviewId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
function * patchReview (authUser, reviewId, entity) {
  return yield _updateReview(authUser, reviewId, entity)
}

patchReview.schema = {
  authUser: joi.object().required(),
  reviewId: joi.string().uuid().required(),
  entity: joi.object().keys({
    score: joi.score(),
    typeId: joi.string().uuid(),
    reviewerId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    scoreCardId: joi.id(),
    submissionId: joi.string().uuid(),
    status: joi.reviewStatus(),
    metadata: joi.object()
  })
}

/**
 * Function to delete review from database
 * @param {Number} reviewId reviewId which need to be deleted
 * @return {Promise}
 */
function * deleteReview (reviewId) {
  const exist = yield _getReview(reviewId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review with ID = ${reviewId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      'id': reviewId
    }
  }

  yield dbhelper.deleteRecord(filter)

  // Push Review deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    'topic': events.submission.delete,
    'originator': originator,
    'timestamp': (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    'payload': {
      'resource': helper.camelize(table),
      'id': reviewId
    }
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)
}

deleteReview.schema = {
  reviewId: joi.string().uuid().required()
}

module.exports = {
  getReview,
  listReviews,
  createReview,
  updateReview,
  patchReview,
  deleteReview
}
