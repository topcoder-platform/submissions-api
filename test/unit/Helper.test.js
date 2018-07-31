/*
 * Unit testing of Helper functions with mocks
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const mocha = require('mocha')
const coMocha = require('co-mocha')
const chai = require('chai')
const chaiHttp = require('chai-http')
const dbhelper = require('../../src/common/dbhelper')
const app = require('../../app')
const should = chai.should() // eslint-disable-line

const { ReviewType } = require('../../src/models/ReviewType')

coMocha(mocha)
chai.use(chaiHttp)

describe('Helper tests', () => {
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
        res.body.message.should.be.eql('The requested resouce cannot be found.')
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
})
