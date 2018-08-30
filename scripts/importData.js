/**
 * Import static data
 */

const co = require('co')
const logger = require('../src/common/logger')
const dbhelper = require('../src/common/dbhelper')

const reviewTypes = require('./data/ReviewTypes.json')

co(function * loadData () {
  logger.info('Data import started!')
  const promises = []
  reviewTypes.forEach((reviewType) => {
    let record = {
      TableName: 'ReviewType',
      Item: reviewType
    }
    promises.push(dbhelper.insertRecord(record))
  })
  yield promises
  logger.info('Data import succeeded!')
  process.exit(0)
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
