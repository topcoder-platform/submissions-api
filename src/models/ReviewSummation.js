/**
 * ReviewSummation table definition
 */

const config = require('config')

const ReviewSummation = {
  TableName: 'ReviewSummation',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' } // S -> String
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: config.AWS_READ_UNITS,
    WriteCapacityUnits: config.AWS_WRITE_UNITS
  }
}

module.exports = {
  ReviewSummation
}
