/**
 * ReviewSummation Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const uuid = require('uuid/v4')
const joi = require('joi')
const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, events } = require('../../constants').busApiMeta
const HelperService = require('./HelperService')

const table = 'ReviewSummation'

/**
 * Function to get Review summation based on ID from DynamoDB
 * This function will be used all by other functions to check existence of Review summation
 * @param {Number} reviewSummationId reviewSummationId which need to be retrieved
 * @return {Object} Data retrieved from database
 */
function * _getReviewSummation (reviewSummationId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      id: reviewSummationId
    }
  }
  const result = yield dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get Review summation based on ID from ES
 * @param {Number} reviewSummationId reviewSummationId which need to be found
 * @return {Object} Data found from database
 */
function * getReviewSummation (reviewSummationId) {
  const response = yield helper.fetchFromES({ id: reviewSummationId }, helper.camelize(table))
  if (response.total === 0) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }
  // Return the retrieved Review summation
  return response.rows[0]
}

getReviewSummation.schema = {
  reviewSummationId: joi.string().uuid().required()
}

/**
 * Function to list review summations from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Object} Data fetched from ES
 */
function * listReviewSummations (query) {
  return yield helper.fetchFromES(query, helper.camelize(table))
}

const listReviewSummationsQuerySchema = {
  scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
  submissionId: joi.string().uuid(),
  aggregateScore: joi.score(),
  isPassing: joi.boolean(),
  isFinal: joi.boolean(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder()
}

listReviewSummationsQuerySchema.sortBy = joi.string().valid(_.difference(
  Object.keys(listReviewSummationsQuerySchema),
  ['page', 'perPage', 'orderBy']
))

listReviewSummations.schema = {
  query: joi.object().keys(listReviewSummationsQuerySchema).with('orderBy', 'sortBy')
}

/**
 * Function to create Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
function * createReviewSummation (authUser, entity) {
  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  const item = _.extend({
    id: uuid(),
    created: currDate,
    updated: currDate,
    createdBy: authUser.handle || authUser.sub,
    updatedBy: authUser.handle || authUser.sub
  }, entity)

  if (entity.isFinal) {
    item.isFinal = entity.isFinal
  }

  if (_.intersection(authUser.roles, ['Administrator', 'administrator']).length === 0 && !authUser.scopes) {
    if (entity.reviewedDate) {
      throw new errors.HttpStatusError(403, 'You are not allowed to set the `reviewedDate` attribute on a review summation')
    }
  }

  item.reviewedDate = entity.reviewedDate || item.created

  yield helper.atomicCreateRecord(table, item)

  // Push Review Summation created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator: originator,
    timestamp: currDate, // time when submission was created
    'mime-type': mimeType,
    payload: _.extend({ resource: helper.camelize(table) }, item)
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReviewSummation.schema = {
  authUser: joi.object().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().required(),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  }).required()
}

/*
 * Function to update Review summation in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
function * _updateReviewSummation (authUser, reviewSummationId, entity) {
  const exist = yield _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  // Check the validness of references using Helper function
  yield HelperService._checkRef(entity)

  let isPassing // Attribute to store boolean value

  if (entity.isPassing === undefined) {
    isPassing = exist.isPassing
  } else {
    isPassing = entity.isPassing
  }

  const currDate = (new Date()).toISOString()

  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      id: reviewSummationId
    },
    UpdateExpression: `set aggregateScore = :s, scoreCardId = :sc, submissionId = :su, 
                        isPassing = :ip, updated = :ua, updatedBy = :ub, reviewedDate = :rd`,
    ExpressionAttributeValues: {
      ':s': entity.aggregateScore || exist.aggregateScore,
      ':sc': entity.scoreCardId || exist.scoreCardId,
      ':su': entity.submissionId || exist.submissionId,
      ':ip': isPassing,
      ':ua': currDate,
      ':ub': authUser.handle || authUser.sub,
      ':rd': entity.reviewedDate || exist.reviewedDate || exist.created
    }
  }
  const sourceAttributeValues = {
    ':s': exist.aggregateScore,
    ':sc': exist.scoreCardId,
    ':su': exist.submissionId,
    ':ip': exist.isPassing,
    ':ua': exist.updated,
    ':ub': exist.updatedBy,
    ':rd': exist.reviewedDate
  }

  // If metadata exists, add it to the update expression
  if (entity.metadata || exist.metadata) {
    record.UpdateExpression = record.UpdateExpression + ', metadata = :ma'
    record.ExpressionAttributeValues[':ma'] = _.merge({}, exist.metadata, entity.metadata)
    sourceAttributeValues[':ma'] = exist.metadata
  }

  // If legacy submission ID exists, add it to the update expression
  if (entity.isFinal || exist.isFinal) {
    let isFinal // Attribute to store boolean value

    if (entity.isFinal === undefined) {
      isFinal = exist.isFinal
    } else {
      isFinal = entity.isFinal
    }

    record.UpdateExpression = record.UpdateExpression + ', isFinal = :ls'
    record.ExpressionAttributeValues[':ls'] = isFinal
    sourceAttributeValues[':ls'] = exist.isFinal
  }

  yield helper.atomicUpdateRecord(table, _.extend({}, exist, entity), exist, record, sourceAttributeValues)

  // Push Review Summation updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator: originator,
    timestamp: currDate, // time when submission was updated
    'mime-type': mimeType,
    payload: _.extend({
      resource: helper.camelize(table),
      id: reviewSummationId,
      updated: currDate,
      updatedBy: authUser.handle || authUser.sub,
      reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created
    }, entity)
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(
    exist,
    entity,
    {
      updated: currDate,
      updatedBy: authUser.handle || authUser.sub,
      reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created
    }
  )
}

/**
 * Function to update Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
function * updateReviewSummation (authUser, reviewSummationId, entity) {
  return yield _updateReviewSummation(authUser, reviewSummationId, entity)
}

updateReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id().required(), joi.string().uuid().required()),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().required(),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  }).required()
}

/**
 * Function to patch Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
function * patchReviewSummation (authUser, reviewSummationId, entity) {
  return yield _updateReviewSummation(authUser, reviewSummationId, entity)
}

patchReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.alternatives().try(joi.id(), joi.string().uuid()),
    submissionId: joi.string().uuid(),
    aggregateScore: joi.score(),
    isPassing: joi.boolean(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    reviewedDate: joi.string()
  })
}

/**
 * Function to delete Review summation from database
 * @param {Number} reviewSummationId reviewSummationId which need to be deleted
 * @return {Promise}
 */
function * deleteReviewSummation (reviewSummationId) {
  const exist = yield _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  yield helper.atomicDeleteRecord(table, exist)

  // Push Review Summation deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator: originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: reviewSummationId
    }
  }

  // Post to Bus API using Client
  yield helper.postToBusApi(reqBody)
}

deleteReviewSummation.schema = {
  reviewSummationId: joi.string().uuid().required()
}

module.exports = {
  getReviewSummation,
  listReviewSummations,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
