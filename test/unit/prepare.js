/*
 * Setting up Mock for all tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const AWS = require('aws-sdk-mock')
const config = require('config')
const nock = require('nock')
const prepare = require('mocha-prepare')
const URL = require('url')
const testData = require('../common/testData')

const nonExistentIds = [testData.nonExReviewTypeId, testData.nonExSubmissionId,
  testData.nonExReviewId, testData.nonExReviewSummationId]

prepare(function (done) {
  // called before loading of test cases
  // Mock AWS DynamoDB interactions
  AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
    if (nonExistentIds.indexOf(params.Key.id) !== -1) {
      callback(null, {})
    } else if (params.Key.id === testData.testReviewType.Item.id) {
      callback(null, testData.testReviewType)
    } else if (params.Key.id === testData.testSubmission.Item.id) {
      callback(null, testData.testSubmission)
    } else if (params.Key.id === testData.testSubmissionWoLegacy.Item.id) {
      callback(null, testData.testSubmissionWoLegacy)
    } else if (params.Key.id === testData.testReview.Item.id) {
      callback(null, testData.testReview)
    } else if (params.Key.id === testData.testReviewSummation.Item.id) {
      callback(null, testData.testReviewSummation)
    }
  })

  AWS.mock('DynamoDB.DocumentClient', 'put', (params, callback) => {
    callback(null, {})
  })

  AWS.mock('DynamoDB.DocumentClient', 'update', (params, callback) => {
    callback(null, {})
  })

  AWS.mock('DynamoDB.DocumentClient', 'delete', (params, callback) => {
    callback(null, {})
  })

  AWS.mock('DynamoDB', 'createTable', (params, callback) => {
    callback(null, {message: 'Table created'})
  })

  AWS.mock('DynamoDB', 'deleteTable', (params, callback) => {
    callback(null, {message: 'Table deleted'})
  })

  // Mock AWS S3 interactions
  AWS.mock('S3', 'upload', (params, callback) => {
    if (params.Metadata.originalname === 'error') {
      callback(new Error('Simulating error'), {})
    } else {
      callback(null, {
        Location: `https://test.s3.com/${params.Key}`,
        Key: params.Key,
        Bucket: config.aws.S3_BUCKET
      })
    }
  })

  // Mock Posting to Bus API and ES interactions
  const authUrl = URL.parse(config.AUTH0_URL)
  const busUrl = URL.parse(config.BUSAPI_EVENTS_URL)
  const challengeApiUrl = URL.parse(`${config.CHALLENGEAPI_URL}/30049360/phases`)

  nock(/.com/)
    .persist()
    .filteringRequestBody((body) => {
      if (body) {
        const parsedBody = JSON.parse(body)
        if (parsedBody.query) {
          if (parsedBody.query.bool.filter[1]) {
            const reqId = parsedBody.query.bool.filter[1].match_phrase.id
            if (nonExistentIds.indexOf(reqId) !== -1) {
              return 'nonExistent'
            }
            return reqId
          }
          return parsedBody.query.bool.filter[0].match_phrase.resource
        }
      }
      return body
    })
    .post(authUrl.path)
    .reply(200, { access_token: 'test' })
    .post(busUrl.path)
    .reply(204)
    .get(challengeApiUrl.path)
    .reply(200, testData.testChallengeAPIResponse)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'reviewType')
    .query(true)
    .reply(200, testData.testReviewTypesES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'submission')
    .query(true)
    .reply(200, testData.testSubmissionsES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'review')
    .query(true)
    .reply(200, testData.testReviewsES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'reviewSummation')
    .query(true)
    .reply(200, testData.testReviewSummationsES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'nonExistent')
    .query(true)
    .reply(200, {hits: {total: 0, hits: []}})
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'c56a4180-65aa-42ec-a945-5fd21dec0501')
    .query(true)
    .reply(200, testData.testReviewTypeES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'a12a4180-65aa-42ec-a945-5fd21dec0501')
    .query(true)
    .reply(200, testData.testSubmissionES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'd24d4180-65aa-42ec-a945-5fd21dec0502')
    .query(true)
    .reply(200, testData.testReviewES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'e45e4180-65aa-42ec-a945-5fd21dec1504')
    .query(true)
    .reply(200, testData.testReviewSummationES)

  done()
}, function (done) {
// called after all test completes (regardless of errors)
  AWS.restore('DynamoDB')
  AWS.restore('DynamoDB.DocumentClient')
  AWS.restore('S3')
  nock.cleanAll()
  done()
})
