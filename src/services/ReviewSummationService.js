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
const tracer = require('../common/tracer')

const table = 'ReviewSummation'

/**
 * Function to get Review summation based on ID from DynamoDB
 * This function will be used all by other functions to check existence of Review summation
 * @param {Number} reviewSummationId reviewSummationId which need to be retrieved
 * @param {Object} parentSpan the parent Span object
 * @return {Object} Data retrieved from database
 */
function * _getReviewSummation (reviewSummationId, parentSpan) {
  const getReviewSummationSpan = tracer.startChildSpans('ReviewSummationService._getReviewSummation', parentSpan)
  getReviewSummationSpan.setTag('reviewSummationId', reviewSummationId)

  try {
    // Construct filter to retrieve record from Database
    const filter = {
      TableName: table,
      Key: {
        id: reviewSummationId
      }
    }
    const result = yield dbhelper.getRecord(filter, getReviewSummationSpan)
    return result.Item
  } finally {
    getReviewSummationSpan.finish()
  }
}

/**
 * Function to get Review summation based on ID from ES
 * @param {Number} reviewSummationId reviewSummationId which need to be found
 * @param {Object} span the Span object
 * @return {Object} Data found from database
 */
function * getReviewSummation (reviewSummationId, span) {
  const getReviewSummationSpan = tracer.startChildSpans('ReviewSummationService.getReviewSummation', span)
  getReviewSummationSpan.setTag('reviewSummationId', reviewSummationId)

  try {
    const response = yield helper.fetchFromES({id: reviewSummationId}, helper.camelize(table), getReviewSummationSpan)
    if (response.total === 0) {
      throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
    }
    // Return the retrieved Review summation
    return response.rows[0]
  } finally {
    getReviewSummationSpan.finish()
  }
}

getReviewSummation.schema = {
  reviewSummationId: joi.string().uuid().required()
}

/**
 * Function to list review summations from Elastic Search
 * @param {Object} query Query filters passed in HTTP request
 * @param {Object} span the Span object
 * @return {Object} Data fetched from ES
 */
function * listReviewSummations (query, span) {
  const listReviewSummationsSpan = tracer.startChildSpans('ReviewSummationService.listReviewSummations', span)

  try {
    return yield helper.fetchFromES(query, helper.camelize(table), listReviewSummationsSpan)
  } finally {
    listReviewSummationsSpan.finish()
  }
}
const listReviewSummationsQuerySchema = {
  scoreCardId: joi.id(),
  submissionId: joi.string().uuid(),
  aggregateScore: joi.score(),
  isPassing: joi.boolean(),
  isFinal: joi.boolean(),
  status: joi.reviewSummationStatus(),
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
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * createReviewSummation (authUser, entity, span) {
  const createReviewSummationSpan = tracer.startChildSpans('ReviewSummationService.createReviewSummation', span)

  try {
    // Check the validness of references using Helper function
    yield HelperService._checkRef(entity, createReviewSummationSpan)

    const currDate = (new Date()).toISOString()

    const item = _.extend({
      id: uuid(),
      created: currDate,
      updated: currDate,
      createdBy: authUser.handle || authUser.sub,
      updatedBy: authUser.handle || authUser.sub,
      status: 'completed'
    }, entity)

    if (entity.isFinal) {
      item.isFinal = entity.isFinal
    }

    const record = {
      TableName: table,
      Item: item
    }

    yield dbhelper.insertRecord(record, createReviewSummationSpan)

    // Push Review Summation created event to Bus API
    // Request body for Posting to Bus API
    const reqBody = {
      topic: events.submission.create,
      originator: originator,
      timestamp: currDate, // time when submission was created
      'mime-type': mimeType,
      payload: _.extend({ 'resource': helper.camelize(table) }, item)
    }

    // Post to Bus API using Client
    yield helper.postToBusApi(reqBody, createReviewSummationSpan)

    // Inserting records in DynamoDB doesn't return any response
    // Hence returning the same entity to be in compliance with Swagger
    return item
  } finally {
    createReviewSummationSpan.finish()
  }
}

createReviewSummation.schema = {
  authUser: joi.object().required(),
  entity: joi.object().keys({
    scoreCardId: joi.id().required(),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().when('status', {
      is: joi.string().valid('queued', 'processing').required(),
      then: joi.forbidden(),
      otherwise: joi.required()
    }),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    status: joi.reviewSummationStatus()
  }).required()
}

/*
 * Function to update Review summation in the database
 * This function will be used internally by both PUT and PATCH
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @param {Object} parentSpan the parent Span object
 * @return {Promise}
 **/
function * _updateReviewSummation (authUser, reviewSummationId, entity, parentSpan) {
  const updateReviewSummationSpan = tracer.startChildSpans('ReviewSummationService._updateReviewSummation', parentSpan)
  updateReviewSummationSpan.setTag('reviewSummationId', reviewSummationId)

  try {
    const exist = yield _getReviewSummation(reviewSummationId, updateReviewSummationSpan)
    if (!exist) {
      throw new errors.HttpStatusError(404, `Review summation with ID = ${reviewSummationId} is not found`)
    }

    // Check the validness of references using Helper function
    yield HelperService._checkRef(entity, updateReviewSummationSpan)

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
                          isPassing = :ip, updated = :ua, updatedBy = :ub`,
      ExpressionAttributeValues: {
        ':s': entity.aggregateScore || exist.aggregateScore,
        ':sc': entity.scoreCardId || exist.scoreCardId,
        ':su': entity.submissionId || exist.submissionId,
        ':ip': isPassing,
        ':ua': currDate,
        ':ub': authUser.handle || authUser.sub
      }
    }

    // If metadata exists, add it to the update expression
    if (entity.metadata || exist.metadata) {
      record.UpdateExpression = record.UpdateExpression + ', metadata = :ma'
      record.ExpressionAttributeValues[':ma'] = _.merge({}, exist.metadata, entity.metadata)
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
    }

    // If status exists, add it to the update expression
    if (entity.status || exist.status) {
      record.UpdateExpression = record.UpdateExpression + ', #st = :st'
      record.ExpressionAttributeValues[':st'] = entity.status || exist.status
      record.ExpressionAttributeNames = {'#st': 'status'}
    }

    yield dbhelper.updateRecord(record, updateReviewSummationSpan)

    // Push Review Summation updated event to Bus API
    // Request body for Posting to Bus API
    const reqBody = {
      topic: events.submission.update,
      originator: originator,
      timestamp: currDate, // time when submission was updated
      'mime-type': mimeType,
      payload: _.extend({ 'resource': helper.camelize(table),
        id: reviewSummationId,
        updated: currDate,
        updatedBy: authUser.handle || authUser.sub }, entity)
    }

    // Post to Bus API using Client
    yield helper.postToBusApi(reqBody, updateReviewSummationSpan)

    // Updating records in DynamoDB doesn't return any response
    // Hence returning the response which will be in compliance with Swagger
    return _.extend(exist, entity, { 'updated': currDate, 'updatedBy': authUser.handle || authUser.sub })
  } finally {
    updateReviewSummationSpan.finish()
  }
}

/**
 * Function to update Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be updated
 * @param {Object} entity Data to be updated
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * updateReviewSummation (authUser, reviewSummationId, entity, span) {
  return yield _updateReviewSummation(authUser, reviewSummationId, entity, span)
}

updateReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.id().required(),
    submissionId: joi.string().uuid().required(),
    aggregateScore: joi.score().when('status', {
      is: joi.string().valid('queued', 'processing').required(),
      then: joi.forbidden(),
      otherwise: joi.required()
    }),
    isPassing: joi.boolean().required(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    status: joi.reviewSummationStatus()
  }).required()
}

/**
 * Function to patch Review summation in database
 * @param {Object} authUser Authenticated User
 * @param {Number} reviewSummationId reviewSummationId which need to be patched
 * @param {Object} entity Data to be patched
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * patchReviewSummation (authUser, reviewSummationId, entity, span) {
  return yield _updateReviewSummation(authUser, reviewSummationId, entity, span)
}

patchReviewSummation.schema = {
  authUser: joi.object().required(),
  reviewSummationId: joi.string().uuid().required(),
  entity: joi.object().keys({
    scoreCardId: joi.id(),
    submissionId: joi.string().uuid(),
    aggregateScore: joi.score().when('status', {
      is: joi.string().valid('queued', 'processing').required(),
      then: joi.forbidden(),
      otherwise: joi.optional()
    }),
    isPassing: joi.boolean(),
    isFinal: joi.boolean(),
    metadata: joi.object(),
    status: joi.reviewSummationStatus()
  })
}

/**
 * Function to delete Review summation from database
 * @param {Number} reviewSummationId reviewSummationId which need to be deleted
 * @param {Object} span the Span object
 * @return {Promise}
 */
function * deleteReviewSummation (reviewSummationId, span) {
  const deleteReviewSummationSpan = tracer.startChildSpans('ReviewSummationService.deleteReviewSummation', span)
  deleteReviewSummationSpan.setTag('reviewSummationId', reviewSummationId)

  try {
    const exist = yield _getReviewSummation(reviewSummationId, deleteReviewSummationSpan)
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

    yield dbhelper.deleteRecord(filter, deleteReviewSummationSpan)

    // Push Review Summation deleted event to Bus API
    // Request body for Posting to Bus API
    const reqBody = {
      topic: events.submission.delete,
      originator: originator,
      timestamp: new Date().toISOString(), // time when submission was deleted
      'mime-type': mimeType,
      payload: {
        resource: helper.camelize(table),
        id: reviewSummationId
      }
    }

    // Post to Bus API using Client
    yield helper.postToBusApi(reqBody, deleteReviewSummationSpan)
  } finally {
    deleteReviewSummationSpan.finish()
  }
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
