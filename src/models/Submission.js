/**
 * Submission table definition
 */

const config = require('config')

const Submission = {
  TableName: 'Submission',
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
  Submission
}
