/*
 * Unit testing of Helper functions with mocks
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const _ = require('lodash')
const mocha = require('mocha')
const coMocha = require('co-mocha')
const chai = require('chai')
const chaiHttp = require('chai-http')
const sinon = require('sinon')
const dbhelper = require('../../src/common/dbhelper')
const helper = require('../../src/common/helper')
const logger = require('../../src/common/logger')
const app = require('../../app')
const should = chai.should() // eslint-disable-line
const assert = chai.assert

const { ReviewType } = require('../../src/models/ReviewType')

const { testReview } = require('../common/testData')

coMocha(mocha)
chai.use(chaiHttp)

describe('Helper tests', () => {
  let loggerInfoStub
  let loggerErrorStub
  let loggerDebugStub
  beforeEach(() => {
    loggerInfoStub = sinon.stub(logger, 'info')
    loggerErrorStub = sinon.stub(logger, 'error')
    loggerDebugStub = sinon.stub(logger, 'debug')
  })
  afterEach(() => {
    loggerErrorStub.restore()
    loggerInfoStub.restore()
    loggerDebugStub.restore()
  })
  it('Create table should create table in DynamoDB', function * () {
    const result = yield dbhelper.createTable(ReviewType)
    result.message.should.be.eql('Table created')
  })

  it('Delete table should delete table in DynamoDB', function * () {
    const result = yield dbhelper.deleteTable(ReviewType.TableName)
    result.message.should.be.eql('Table deleted')
  })

  it('Accessing invalid routes should throw 404', (done) => {
    chai.request(app)
      .get(`${config.API_VERSION}/invalid`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .end((err, res) => {
        res.should.have.status(404)
        res.body.message.should.be.eql('The requested resource cannot be found.')
        done()
      })
  })

  it('Accessing routes with invalid methods should throw 405', (done) => {
    chai.request(app)
      .patch(`${config.API_VERSION}/submissions`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .end((err, res) => {
        res.should.have.status(405)
        res.body.message.should.be.eql('The requested HTTP method is not supported.')
        done()
      })
  })

  it('Create item to es error should send error event and not rollback', function * () {
    const action = 'Review.create'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000000'})
    try {
      yield helper.atomicCreateRecord('Review', item)
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Create item to db error should rollback es and send error event', function * () {
    const action = 'Review.create'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000001'})
    try {
      yield helper.atomicCreateRecord('Review', item)
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.calledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Create item success should not rollback and not send error event', function * () {
    const action = 'Review.create'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000002'})
    yield helper.atomicCreateRecord('Review', item)
    assert(loggerErrorStub.neverCalledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.neverCalledWithMatch(/Publish error to Kafka topic/))
  })
  it('Update item to es error should not rollback anything but send error event', function * () {
    const action = 'Review.update'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000003'})
    try {
      yield helper.atomicUpdateRecord('Review', item, item, {Key: {id: item.id}}, {})
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Update item to db error should rollback es and send error event', function * () {
    const action = 'Review.update'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000004'})
    try {
      yield helper.atomicUpdateRecord('Review', item, item, {Key: {id: item.id}}, {})
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.calledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Update item success should not rollback and not send error event', function * () {
    const action = 'Review.update'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000005'})
    yield helper.atomicUpdateRecord('Review', item, item, {Key: {id: item.id}}, {})
    assert(loggerErrorStub.neverCalledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.neverCalledWithMatch(/Publish error to Kafka topic/))
  })
  it('Delete item to es error should not rollback but send error event', function * () {
    const action = 'Review.delete'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000006'})
    try {
      yield helper.atomicDeleteRecord('Review', item)
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Delete item to db error should rollback es and send error event', function * () {
    const action = 'Review.delete'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000007'})
    try {
      yield helper.atomicDeleteRecord('Review', item)
    } catch (err) {
    }
    assert(loggerErrorStub.calledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.calledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.calledWithMatch(/Publish error to Kafka topic/))
  })
  it('Delete item success should not rollback and not send error event', function * () {
    const action = 'Review.delete'
    const item = _.assign({}, testReview.Item, {id: 'd24d4180-65aa-42ec-a945-5fd210000008'})
    yield helper.atomicDeleteRecord('Review', item)
    assert(loggerErrorStub.neverCalledWith(`Error while running ${action} with id: ${item.id}, try to rollback`))
    assert(loggerErrorStub.neverCalledWith(`Error while rolling back ${action} with id: ${item.id}`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} db with id: ${item.id} success`))
    assert(loggerInfoStub.neverCalledWith(`Rollback ${action} es with id: ${item.id} success`))
    assert(loggerDebugStub.neverCalledWithMatch(/Publish error to Kafka topic/))
  })
})
