/**
 * DynamoDB database helper functions
 */

const config = require('config')
const AWS = require('aws-sdk')

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
  if (!dbs['conn']) {
    dbs['conn'] = new AWS.DynamoDB()
  }
  return dbs['conn']
}

/**
 * Get DynamoDB Document Client
 * @return {Object} DynamoDB Document Client Instance
 */
function getDbClient () {
  if (!dbClients['client']) {
    dbClients['client'] = new AWS.DynamoDB.DocumentClient()
  }
  return dbClients['client']
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
 * @return    {promise}
 */
function * insertRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.put(record, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Get single record from DynamoDB based on the filter
 * @param     {object} filter Filter to be applied on the database
 * @return    {promise}
 */
function * getRecord (filter) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.get(filter, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Update record in DynamoDB
 * @param     {object} record Data to be updated
 * @return    {promise}
 */
function * updateRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.update(record, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Delete record in DynamoDB
 * @param     {object} filter Filter to be used for deleting records
 * @return    {promise}
 */
function * deleteRecord (filter) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.delete(filter, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}

/**
 * Get multiple records from DynamoDB based on the parameters
 * @param     {object} params Parameters to be used for Scanning
 * @return    {promise}
 */
function * scanRecords (params) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.scan(params, (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
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
  scanRecords
}
