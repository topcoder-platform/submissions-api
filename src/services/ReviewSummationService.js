/**
 * ReviewSummation Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
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
 * @return {Promise<Object>} Data retrieved from database
 */
async function _getReviewSummation (reviewSummationId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      id: reviewSummationId
    }
  }
  const result = await dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get Review summation based on ID from ES
 * @param {Number} reviewSummationId reviewSummationId which need to be found
 * @return {Promise<Object>} Data found from database
 */
async function getReviewSummation (reviewSummationId) {
  const response = await helper.fetchFromES({ id: reviewSummationId }, helper.camelize(table))
  if (response.total === 0) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }
  // Return the retrieved Review summation
  return response.rows[0]
}

getReviewSummation.schema = joi.object({
  reviewSummationId: joi.string().uuid().required()
}).required()

/**
 * Function to list review summations from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Promise<Object>} Data fetched from ES
 */
async function listReviewSummations (query) {
  return helper.fetchFromES(query, helper.camelize(table))
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

listReviewSummationsQuerySchema.sortBy = joi.string().valid(..._.difference(
  Object.keys(listReviewSummationsQuerySchema),
  ['page', 'perPage', 'orderBy']
))

listReviewSummations.schema = joi.object({
  query: joi.object().keys(listReviewSummationsQuerySchema).with('orderBy', 'sortBy')
}).required()

/**
 * Function to create Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createReviewSummation (authUser, entity) {
  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  const currDate = (new Date()).toISOString()

  const item = _.extend({
    id: uuidv4(),
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

  const record = {
    TableName: table,
    Item: item
  }

  await dbhelper.insertRecord(record)

  await helper.sendHarmonyEvent('CREATE', table, item)

  // Push Review Summation created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator,
    timestamp: currDate, // time when submission was created
    'mime-type': mimeType,
    payload: _.extend({ resource: helper.camelize(table) }, item)
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReviewSummation.schema = joi.object({
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
}).required()

/**
 * Function to update Review summation in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
async function _updateReviewSummation (authUser, reviewSummationId, entity) {
  const exist = await _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  // Check the validness of references using Helper function
  await HelperService._checkRef(entity)

  let isPassing // Attribute to store boolean value

  if (entity.isPassing === undefined) {
    isPassing = exist.isPassing
  } else {
    isPassing = entity.isPassing
  }

  const currDate = (new Date()).toISOString()

  const item = {
    id: reviewSummationId,
    submissionId: entity.submissionId || exist.submissionId,
    scoreCardId: entity.scoreCardId || exist.scoreCardId,
    aggregateScore: entity.aggregateScore || exist.aggregateScore,
    reviewedDate: entity.reviewedDate || exist.reviewedDate || exist.created,
    isPassing,
    updated: currDate,
    updatedBy: authUser.handle || authUser.sub
  }

  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      id: reviewSummationId
    },
    UpdateExpression: `set aggregateScore = :s, scoreCardId = :sc, submissionId = :su, 
                        isPassing = :ip, updated = :ua, updatedBy = :ub, reviewedDate = :rd`,
    ExpressionAttributeValues: {
      ':s': item.aggregateScore,
      ':sc': item.scoreCardId,
      ':su': item.submissionId,
      ':ip': item.isPassing,
      ':ua': item.updated,
      ':ub': item.updatedBy,
      ':rd': item.reviewedDate
    }
  }

  // If metadata exists, add it to the update expression
  if (entity.metadata || exist.metadata) {
    item.metadata = _.merge({}, exist.metadata, entity.metadata)
    record.UpdateExpression = record.UpdateExpression + ', metadata = :ma'
    record.ExpressionAttributeValues[':ma'] = item.metadata
  }

  // If legacy submission ID exists, add it to the update expression
  if (entity.isFinal || exist.isFinal) {
    let isFinal // Attribute to store boolean value

    if (entity.isFinal === undefined) {
      isFinal = exist.isFinal
    } else {
      isFinal = entity.isFinal
    }
    item.isFinal = isFinal
    record.UpdateExpression = record.UpdateExpression + ', isFinal = :ls'
    record.ExpressionAttributeValues[':ls'] = isFinal
  }

  await dbhelper.updateRecord(record)

  await helper.sendHarmonyEvent('UPDATE', table, item)

  // Push Review Summation updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator,
    timestamp: currDate, // time when submission was updated
    'mime-type': mimeType,
    payload: _.extend(
      {
        resource: helper.camelize(table)
      },
      item
    )
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, item)
}

/**
 * Function to update Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
async function updateReviewSummation (authUser, reviewSummationId, entity) {
  return _updateReviewSummation(authUser, reviewSummationId, entity)
}

updateReviewSummation.schema = joi.object({
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
}).required()

/**
 * Function to patch Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
async function patchReviewSummation (authUser, reviewSummationId, entity) {
  return _updateReviewSummation(authUser, reviewSummationId, entity)
}

patchReviewSummation.schema = joi.object({
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
}).required()

/**
 * Function to delete Review summation from database
 * @param {Number} reviewSummationId reviewSummationId which need to be deleted
 * @return {Promise}
 */
async function deleteReviewSummation (reviewSummationId) {
  const exist = await _getReviewSummation(reviewSummationId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      id: reviewSummationId
    }
  }

  await dbhelper.deleteRecord(filter)

  await helper.sendHarmonyEvent('DELETE', table, {
    id: reviewSummationId,
    submissionId: exist.submissionId
  })

  // Push Review Summation deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: reviewSummationId
    }
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)
}

deleteReviewSummation.schema = joi.object({
  reviewSummationId: joi.string().uuid().required()
}).required()

module.exports = {
  getReviewSummation,
  listReviewSummations,
  createReviewSummation,
  updateReviewSummation,
  patchReviewSummation,
  deleteReviewSummation
}
