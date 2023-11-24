/**
 * Reviewtype Service
 */

const errors = require('common-errors')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const joi = require('joi')
const dbhelper = require('../common/dbhelper')
const helper = require('../common/helper')
const { originator, mimeType, events } = require('../../constants').busApiMeta

const table = 'ReviewType'

/**
 * Function to get review type based on ID from DyanmoDB
 * This function will be used all by other functions to check existence of review type
 * @param {Number} reviewTypeId ReviewTypeId which need to be retrieved
 * @return {Promise<Object>} Data retrieved from database
 */
async function _getReviewType (reviewTypeId) {
  // Construct filter to retrieve record from Database
  const filter = {
    TableName: table,
    Key: {
      id: reviewTypeId
    }
  }
  const result = await dbhelper.getRecord(filter)
  return result.Item
}

/**
 * Function to get review type based on ID from ES
 * @param {Number} reviewTypeId ReviewTypeId which need to be found
 * @return {Promise<Object>} Data found from database
 */
async function getReviewType (reviewTypeId) {
  const response = await helper.fetchFromES({ id: reviewTypeId }, helper.camelize(table))
  if (response.total === 0) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }
  // Return the retrieved review type
  return response.rows[0]
}

getReviewType.schema = joi.object({
  reviewTypeId: joi.string().uuid().required()
}).required()

/**
 * Function to list review types from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @return {Promise<Object>} Data fetched from ES
 */
async function listReviewTypes (query) {
  return helper.fetchFromES(query, helper.camelize(table))
}

const listReviewTypesQuerySchema = {
  name: joi.string(),
  isActive: joi.boolean(),
  page: joi.id(),
  perPage: joi.pageSize(),
  orderBy: joi.sortOrder()
}

listReviewTypesQuerySchema.sortBy = joi.string().valid(..._.difference(
  Object.keys(listReviewTypesQuerySchema),
  ['page', 'perPage', 'orderBy', 'name']
))

listReviewTypes.schema = joi.object({
  query: joi.object().keys(listReviewTypesQuerySchema).with('orderBy', 'sortBy')
}).required()

/**
 * Function to create review type in database
 * @param {Object} entity Data to be inserted
 * @return {Promise}
 */
async function createReviewType (entity) {
  const item = _.extend({ id: uuidv4() }, entity)
  // Prepare record to be inserted
  const record = {
    TableName: table,
    Item: item
  }

  await dbhelper.insertRecord(record)

  await helper.sendHarmonyEvent('CREATE', table, item)

  // Push Review Type created event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.create,
    originator,
    timestamp: (new Date()).toISOString(), // time when submission was created
    'mime-type': mimeType,
    payload: _.extend({ resource: helper.camelize(table) }, item)
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Inserting records in DynamoDB doesn't return any response
  // Hence returning the same entity to be in compliance with Swagger
  return item
}

createReviewType.schema = joi.object({
  entity: joi.object().keys({
    name: joi.string().required(),
    isActive: joi.boolean().required()
  }).required()
}).required()

/**
 * Function to update review type in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Number} reviewTypeId ReviewTypeId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 **/
async function _updateReviewType (reviewTypeId, entity) {
  const exist = await _getReviewType(reviewTypeId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }

  let isActive // Attribute to store boolean value

  if (entity.isActive === undefined) {
    isActive = exist.isActive
  } else {
    isActive = entity.isActive
  }

  // Record used for updating in Database
  const record = {
    TableName: table,
    Key: {
      id: reviewTypeId
    },
    UpdateExpression: 'set #name = :n, isActive = :a',
    ExpressionAttributeValues: {
      ':n': entity.name || exist.name,
      ':a': isActive
    },
    ExpressionAttributeNames: {
      '#name': 'name'
    }
  }
  await dbhelper.updateRecord(record)

  const eventPayload = _.extend({
    resource: helper.camelize(table),
    id: reviewTypeId
  }, entity)
  await helper.sendHarmonyEvent('UPDATE', table, _.omit(eventPayload, 'resource'))

  // Push Review Type updated event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.update,
    originator,
    timestamp: (new Date()).toISOString(), // time when submission was updated
    'mime-type': mimeType,
    payload: eventPayload
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)

  // Updating records in DynamoDB doesn't return any response
  // Hence returning the response which will be in compliance with Swagger
  return _.extend(exist, entity)
}

/**
 * Function to update review type in database
 * @param {Number} reviewTypeId ReviewTypeId which need to be updated
 * @param {Object} entity Data to be updated
 * @return {Promise}
 */
async function updateReviewType (reviewTypeId, entity) {
  return _updateReviewType(reviewTypeId, entity)
}

updateReviewType.schema = joi.object({
  reviewTypeId: joi.string().uuid().required(),
  entity: joi.object().keys({
    name: joi.string().required(),
    isActive: joi.boolean().required()
  }).required()
}).required()

/**
 * Function to patch review type in database
 * @param {Number} reviewTypeId ReviewTypeId which need to be patched
 * @param {Object} entity Data to be patched
 * @return {Promise}
 */
async function patchReviewType (reviewTypeId, entity) {
  return _updateReviewType(reviewTypeId, entity)
}

patchReviewType.schema = joi.object({
  reviewTypeId: joi.string().uuid().required(),
  entity: joi.object().keys({
    name: joi.string(),
    isActive: joi.boolean()
  })
}).required()

/**
 * Function to delete review type from database
 * @param {Number} reviewTypeId ReviewTypeId which need to be deleted
 * @return {Promise}
 */
async function deleteReviewType (reviewTypeId) {
  const exist = await _getReviewType(reviewTypeId)
  if (!exist) {
    throw new errors.HttpStatusError(404, `Review type with ID = ${reviewTypeId} is not found`)
  }

  // Filter used to delete the record
  const filter = {
    TableName: table,
    Key: {
      id: reviewTypeId
    }
  }

  await dbhelper.deleteRecord(filter)

  await helper.sendHarmonyEvent('DELETE', table, { id: reviewTypeId })

  // Push Review Type deleted event to Bus API
  // Request body for Posting to Bus API
  const reqBody = {
    topic: events.submission.delete,
    originator,
    timestamp: (new Date()).toISOString(), // time when submission was deleted
    'mime-type': mimeType,
    payload: {
      resource: helper.camelize(table),
      id: reviewTypeId
    }
  }

  // Post to Bus API using Client
  await helper.postToBusApi(reqBody)
}

deleteReviewType.schema = joi.object({
  reviewTypeId: joi.string().uuid().required()
}).required()

module.exports = {
  getReviewType,
  _getReviewType,
  listReviewTypes,
  createReviewType,
  updateReviewType,
  patchReviewType,
  deleteReviewType
}
