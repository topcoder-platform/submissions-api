/**
 * Review table definition
 */

const config = require('config')
const { submissionIndex } = require('../../constants')

const Review = {
  TableName: 'Review',
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' } // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' }, // S -> String
    { AttributeName: 'submissionId', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: config.aws.AWS_READ_UNITS,
    WriteCapacityUnits: config.aws.AWS_WRITE_UNITS
  },
  GlobalSecondaryIndexes: [
    {
      IndexName: submissionIndex,
      KeySchema: [
        {
          AttributeName: 'submissionId',
          KeyType: 'HASH'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }
  ]
}

module.exports = {
  Review
}
