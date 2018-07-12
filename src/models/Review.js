/**
 * Review table definition
 */

const config = require('config')

const Review = {
  TableName: 'Review',
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
  Review
}
