/*
 * Setting up Mock for all tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const fs = require('fs')
const AWS = require('aws-sdk-mock')
const config = require('config')
const nock = require('nock')
const prepare = require('mocha-prepare')
const URL = require('url')
const jwt = require('jsonwebtoken')
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
    } else if (params.Key.id === testData.testSubmissionWReview.Item.id) {
      callback(null, testData.testSubmissionWReview)
    } else if (params.Key.id === testData.testReview.Item.id) {
      callback(null, testData.testReview)
    } else if (params.Key.id === testData.testReviewSummation.Item.id) {
      callback(null, testData.testReviewSummation)
    }
  })

  AWS.mock('DynamoDB.DocumentClient', 'query', (params, callback) => {
    if (params.TableName === 'Review' && params.ExpressionAttributeValues[':p_submissionId'] && params.ExpressionAttributeValues[':p_submissionId'] === testData.testSubmissionWReview.Item.id) {
      callback(null, {Count: 1, Items: testData.testSubmissionWReview.Item.review})
    } else if (params.TableName === 'ReviewSummation' && params.ExpressionAttributeValues[':p_submissionId'] && params.ExpressionAttributeValues[':p_submissionId'] === testData.testSubmissionWReview.Item.id) {
      callback(null, {Count: 1, Items: testData.testSubmissionWReview.Item.reviewSummation})
    } else {
      callback(null, {Count: 0})
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
    callback(null, { message: 'Table created' })
  })

  AWS.mock('DynamoDB', 'deleteTable', (params, callback) => {
    callback(null, { message: 'Table deleted' })
  })

  // Mock AWS S3 interactions
  AWS.mock('S3', 'upload', (params, callback) => {
    if (params.Metadata.originalname === 'error' || params.Metadata.originalname === 'error.zip') {
      callback(new Error('Simulating error'), {})
    } else {
      callback(null, {
        Location: `https://test.s3.com/${params.Key}`,
        Key: params.Key,
        Bucket: config.aws.S3_BUCKET
      })
    }
  })

  AWS.mock('S3', 'getObject', (params, callback) => {
    callback(null, {Body: fs.readFileSync('./test/common/fileToUpload.zip')})
  })

  AWS.mock('S3', 'listObjects', (params, callback) => {
    if (params.Prefix === 'a12a4180-65aa-42ec-a945-5fd21dec0501/nonExistentFile.zip') {
      callback(null, {Contents: []})
    } else {
      callback(null, {Contents: [{Location: 'https://test.s3.com/fileToUpload.zip', Key: 'a12a4180-65aa-42ec-a945-5fd21dec0501/fileToUpload.zip.zip', Bucket: config.aws.S3_BUCKET}]})
    }
  })

  AWS.mock('S3', 'deleteObject', (params, callback) => {
    callback(null, {})
  })

  // Mock Posting to Bus API and ES interactions
  const authUrl = URL.parse(config.AUTH0_URL)
  const busUrl = URL.parse(config.BUSAPI_EVENTS_URL)
  const challengeApiUrl = URL.parse(`${config.CHALLENGEAPI_URL}/${testData.testSubmissionWoLegacy.Item.challengeId}/phases`)
  const challengeApiUrl2 = URL.parse(`${config.CHALLENGEAPI_URL}/${testData.testSubmission.Item.challengeId}/phases`)
  const challengeV5ApiUrl = URL.parse(`${config.CHALLENGEAPI_V5_URL}/${testData.testChallengeV5APIResponse.id}`)
  const challengeDetailUrl = URL.parse(`${config.CHALLENGEAPI_URL}?filter=id=${testData.testSubmission.Item.challengeId}`)
  const challengeWoLegacyUrl = URL.parse(`${config.CHALLENGEAPI_URL}?filter=id=${testData.testSubmissionWoLegacy.Item.challengeId}`)

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
    .head('/')
    .reply(200)
    .post(authUrl.path)
    .reply(200, { access_token: jwt.sign({user: 'test', exp: 9999999999999999}, config.AUTH_SECRET) })
    .post(busUrl.path)
    .reply(204)
    .get(challengeV5ApiUrl.path)
    .reply(200, testData.testChallengeV5APIResponse)
    .get(challengeApiUrl.path)
    .reply(200, testData.testChallengeAPIResponse)
    .get(challengeApiUrl2.path)
    .reply(200, testData.testChallengeAPIResponse)
    .get(challengeDetailUrl.path)
    .reply(200, testData.testChallengeDetailResponse)
    .get(challengeWoLegacyUrl.path)
    .reply(200, testData.testChallengeDetailResponse)
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
    .reply(200, { hits: { total: 0, hits: [] } })
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'c56a4180-65aa-42ec-a945-5fd21dec0501')
    .query(true)
    .reply(200, testData.testReviewTypeES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'a12a4180-65aa-42ec-a945-5fd21dec0501')
    .query(true)
    .reply(200, testData.testSubmissionES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'a12a4180-65aa-42ec-a945-5fd21dec0502')
    .query(true)
    .reply(200, testData.testSubmissionWoLegacyES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'd24d4180-65aa-42ec-a945-5fd21dec0502')
    .query(true)
    .reply(200, testData.testReviewES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'e45e4180-65aa-42ec-a945-5fd21dec1504')
    .query(true)
    .reply(200, testData.testReviewSummationES)
    .post(`/${config.esConfig.ES_INDEX}/${config.esConfig.ES_TYPE}/_search`, 'a12a4180-65aa-42ec-a945-5fd21dec0503')
    .query(true)
    .reply(200, { hits: { total: 0, hits: [] } })

  done()
}, function (done) {
// called after all test completes (regardless of errors)
  AWS.restore('DynamoDB')
  AWS.restore('DynamoDB.DocumentClient')
  AWS.restore('S3')
  nock.cleanAll()
  done()
})
