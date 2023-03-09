/**
 * DynamoDB database helper functions
 */

const config = require('config')
const AWS = require('aws-sdk')

// Database instance mapping
const dbs = {}
// Database Document client mapping
const dbClients = {}

AWS.config.update({
  region: config.aws.AWS_REGION
})

/**
 * Get DynamoDB Connection Instance
 * @return {Object} DynamoDB Connection Instance
 */
function getDb() {
  if (!dbs.conn) {
    dbs.conn = new AWS.DynamoDB()
  }
  return dbs.conn
}

/**
 * Get DynamoDB Document Client
 * @return {Object} DynamoDB Document Client Instance
 */
function getDbClient() {
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
async function createTable(model) {
  const db = getDb()
  return await db.createTable(model).promise()
}

/**
 * Deletes table in DynamoDB
 * @param     {String} tableName Name of the table to be deleted
 * @return    {promise}
 */
async function deleteTable(tableName) {
  const db = getDb()
  const item = {
    TableName: tableName
  }
  return await db.deleteTable(item).promise()
}

/**
 * Insert record in DynamoDB
 * @param     {object} record Data to be inserted
 * @return    {promise}
 */
async function insertRecord(record) {
  const dbClient = getDbClient()
  return await dbClient.put(record).promise()
}

/**
 * Get single record from DynamoDB based on the filter
 * @param     {object} filter Filter to be applied on the database
 * @return    {promise}
 */
async function getRecord(filter) {
  const dbClient = getDbClient()
  await dbClient.get(filter).promise()
}

/**
 * Update record in DynamoDB
 * @param     {object} record Data to be updated
 * @return    {promise}
 */
async function updateRecord(record) {
  const dbClient = getDbClient()
  return await dbClient.update(record).promise()
}

/**
 * Delete record in DynamoDB
 * @param     {object} filter Filter to be used for deleting records
 * @return    {promise}
 */
async function deleteRecord(filter) {
  const dbClient = getDbClient()
  await dbClient.delete(filter).promise()
}

/**
 * Get multiple records from DynamoDB based on the parameters
 * @param     {object} params Parameters to be used for Scanning
 * @return    {promise}
 */
async function scanRecords(params) {
  const dbClient = getDbClient()
  const results = await dbClient.scan(params).promise()
  return results
}

/**
 * Get records from DynamoDB based on the secondary index filter
 * @param     {object} filter Secondary index filter to be applied on the database
 * @return    {promise}
 */
async function queryRecords(filter) {
  const dbClient = getDbClient()
  return await dbClient.query(filter).promise()
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
