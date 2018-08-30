/**
 * ReviewType table definition
 */

const config = require('config')

const ReviewType = {
  TableName: 'ReviewType',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' } // S -> String
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: config.aws.AWS_READ_UNITS,
    WriteCapacityUnits: config.aws.AWS_WRITE_UNITS
  }
}

module.exports = {
  ReviewType
}
