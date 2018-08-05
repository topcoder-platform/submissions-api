/*
 * Unit testing of Helper functions with mocks
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('../../app')
const should = chai.should() // eslint-disable-line

chai.use(chaiHttp)

describe('Helper tests', () => {
  it('Accessing invalid routes should throw 404', (done) => {
    chai.request(app)
      .get(`${config.API_VERSION}/invalid`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .end((err, res) => {
        res.should.have.status(404)
        res.body.message.should.be.eql('The requested resource cannot be found.')
        done()
      })
  }).timeout(20000)

  it('Accessing routes with invalid methods should throw 405', (done) => {
    chai.request(app)
      .patch(`${config.API_VERSION}/submissions`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .end((err, res) => {
        res.should.have.status(405)
        res.body.message.should.be.eql('The requested HTTP method is not supported.')
        done()
      })
  }).timeout(20000)
})
