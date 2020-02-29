/**
 * SubmissionArtifactMap table definition
 */

const config = require('config')

const SubmissionArtifactMap = {
  TableName: 'SubmissionArtifactMap',
  KeySchema: [
    { AttributeName: 'submissionId', KeyType: 'HASH' }, // Partition key
    { AttributeName: 'artifactFileName', KeyType: 'RANGE' } // Range key
  ],
  AttributeDefinitions: [
    { AttributeName: 'submissionId', AttributeType: 'S' }, // S -> String
    { AttributeName: 'artifactFileName', AttributeType: 'S' } // S -> String
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: config.aws.AWS_READ_UNITS,
    WriteCapacityUnits: config.aws.AWS_WRITE_UNITS
  }
}

module.exports = {
  SubmissionArtifactMap
}
