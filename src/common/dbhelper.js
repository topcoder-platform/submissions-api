/**
 * DynamoDB database helper functions
 */

const config = require('config')
const AWS = require('aws-sdk')
const tracer = require('./tracer')

// Database instance mapping
const dbs = { }
// Database Document client mapping
const dbClients = { }

AWS.config.update({
  region: config.aws.AWS_REGION
})

/**
 * Get DynamoDB Connection Instance
 * @return {Object} DynamoDB Connection Instance
 */
function getDb () {
  if (!dbs.conn) {
    dbs.conn = new AWS.DynamoDB()
  }
  return dbs.conn
}

/**
 * Get DynamoDB Document Client
 * @return {Object} DynamoDB Document Client Instance
 */
function getDbClient () {
  if (!dbClients.client) {
    dbClients.client = new AWS.DynamoDB.DocumentClient()
  }
  return dbClients.client
}

/**
 * Creates table in DynamoDB
 * @param     {object} model Table structure in JSON format
 * @return    {promise}
 */
function * createTable (model) {
  const db = getDb()
  return new Promise((resolve, reject) => {
    db.createTable(model, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Deletes table in DynamoDB
 * @param     {String} tableName Name of the table to be deleted
 * @return    {promise}
 */
function * deleteTable (tableName) {
  const db = getDb()
  const item = {
    TableName: tableName
  }
  return new Promise((resolve, reject) => {
    db.deleteTable(item, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Insert record in DynamoDB
 * @param     {object} record Data to be inserted
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * insertRecord (record, parentSpan) {
  // Initial database insert record script (for local development) will not have tracer info
  let insertRecordSpan
  if (parentSpan) {
    insertRecordSpan = tracer.startChildSpans('DynamoDB.put', parentSpan)
    insertRecordSpan.log({
      event: 'info',
      record: record
    })
  }

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.put(record, (err, data) => {
      if (err) {
        if (insertRecordSpan) {
          insertRecordSpan.setTag('error', true)
          insertRecordSpan.finish()
        }
        return reject(err)
      }

      if (insertRecordSpan) {
        insertRecordSpan.finish()
      }
      return resolve(data)
    })
  })
}

/**
 * Get single record from DynamoDB based on the filter
 * @param     {object} filter Filter to be applied on the database
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * getRecord (filter, parentSpan) {
  const getRecordSpan = tracer.startChildSpans('DynamoDB.get', parentSpan)
  getRecordSpan.log({
    event: 'info',
    filter: filter
  })

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.get(filter, (err, data) => {
      if (err) {
        getRecordSpan.setTag('error', true)
        getRecordSpan.finish()
        return reject(err)
      }
      getRecordSpan.finish()
      return resolve(data)
    })
  })
}

/**
 * Update record in DynamoDB
 * @param     {object} record Data to be updated
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * updateRecord (record, parentSpan) {
  const updateRecordSpan = tracer.startChildSpans('DynamoDB.update', parentSpan)
  updateRecordSpan.log({
    event: 'info',
    record: record
  })

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.update(record, (err, data) => {
      if (err) {
        updateRecordSpan.setTag('error', true)
        updateRecordSpan.finish()
        return reject(err)
      }
      updateRecordSpan.finish()
      return resolve(data)
    })
  })
}

/**
 * Delete record in DynamoDB
 * @param     {object} filter Filter to be used for deleting records
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * deleteRecord (filter, parentSpan) {
  const deleteRecordSpan = tracer.startChildSpans('DynamoDB.delete', parentSpan)
  deleteRecordSpan.log({
    event: 'info',
    filter: filter
  })

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.delete(filter, (err, data) => {
      if (err) {
        deleteRecordSpan.setTag('error', true)
        deleteRecordSpan.finish()
        return reject(err)
      }
      deleteRecordSpan.finish()
      return resolve(data)
    })
  })
}

/**
 * Get multiple records from DynamoDB based on the parameters
 * @param     {object} params Parameters to be used for Scanning
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * scanRecords (params, parentSpan) {
  const scanRecordsSpan = tracer.startChildSpans('DynamoDB.scan', parentSpan)
  scanRecordsSpan.log({
    event: 'info',
    params: params
  })

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.scan(params, (err, data) => {
      if (err) {
        scanRecordsSpan.setTag('error', true)
        scanRecordsSpan.finish()
        return reject(err)
      }
      scanRecordsSpan.finish()
      return resolve(data)
    })
  })
}

/**
 * Get records from DynamoDB based on the secondary index filter
 * @param     {object} filter Secondary index filter to be applied on the database
 * @param     {Object} parentSpan the parent Span object
 * @return    {promise}
 */
function * queryRecords (filter, parentSpan) {
  const queryRecordsSpan = tracer.startChildSpans('DynamoDB.query', parentSpan)
  queryRecordsSpan.log({
    event: 'info',
    filter: filter
  })

  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.query(filter, (err, data) => {
      if (err) {
        queryRecordsSpan.setTag('error', true)
        queryRecordsSpan.finish()
        return reject(err)
      }
      queryRecordsSpan.finish()
      return resolve(data)
    })
  })
}

// exports the functions
module.exports = {
  getDb,
  getDbClient,
  createTable,
  deleteTable,
  insertRecord,
  getRecord,
  updateRecord,
  deleteRecord,
  scanRecords,
  queryRecords
}
