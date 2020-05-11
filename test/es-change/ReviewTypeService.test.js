/*
 * Review Type service ES change related tests
 */

/* eslint-disable handle-callback-err */

const config = require('config')
const _ = require('lodash')
const chai = require('chai')
const chaiHttp = require('chai-http')
const mocha = require('mocha')
const coMocha = require('co-mocha')
const should = chai.should() // eslint-disable-line
const app = require('../../app')
const {
  nonExReviewTypeId, testReviewType
} = require('../common/testData')
const ReviewTypes = require('../../scripts/data/ReviewTypes.json')

coMocha(mocha)
chai.use(chaiHttp)

describe('ReviewType Service tests', () => {
  describe('GET /reviewTypes/:reviewTypeId', () => {
    it('Getting non existent review type should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${nonExReviewTypeId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Getting existing review type should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes/${testReviewType.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewType.Item))
          res.body.id.should.be.eql(testReviewType.Item.id)
          res.body.name.should.be.eql(testReviewType.Item.name)
          res.body.isActive.should.be.eql(testReviewType.Item.isActive)
          done()
        })
    }).timeout(20000)
  })

  describe('GET /reviewTypes', () => {
    it('Filtering all review types should return all review types', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(8)
          _.map(res.body, 'id').should.have.members(_.map(ReviewTypes, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review types with isActive true filter should work properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?isActive=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(6)
          const activeReviewTypes = _.filter(ReviewTypes, (rt) => {
            return rt.isActive === true
          })
          _.map(res.body, 'id').should.have.members(_.map(activeReviewTypes, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review types with isActive false filter should work properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?isActive=false`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const inactiveReviewTypes = _.filter(ReviewTypes, (rt) => {
            return rt.isActive === false
          })
          _.map(res.body, 'id').should.have.members(_.map(inactiveReviewTypes, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review types with valid name filter should be case insensitive and work properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?name=review`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(4)
          const filtered = _.filter(ReviewTypes, (rt) => {
            return rt.name.toLowerCase().includes('review')
          })
          _.map(res.body, 'id').should.have.members(_.map(filtered, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review types with non existent names should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?name=junk`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewTypes?name=approval&isActive=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)
  })
})
