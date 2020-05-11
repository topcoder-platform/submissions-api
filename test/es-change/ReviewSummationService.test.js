/*
 * Review Summation service ES change related tests
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
const { nonExReviewSummationId, testReviewSummation } = require('../common/testData')
const ReviewSummations = require('../../scripts/data/ReviewSummations.json')

coMocha(mocha)
chai.use(chaiHttp)

describe('Review Summation Service tests', () => {
  describe('GET /reviewSummations/:reviewSummationId', () => {
    it('Getting non existent Review Summation should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${nonExReviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review summation with ID = ${nonExReviewSummationId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Getting existing Review Summation should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${testReviewSummation.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummation.Item))
          res.body.id.should.be.eql(testReviewSummation.Item.id)
          res.body.aggregateScore.should.be.eql(testReviewSummation.Item.aggregateScore)
          res.body.submissionId.should.be.eql(testReviewSummation.Item.submissionId)
          res.body.scoreCardId.should.be.eql(testReviewSummation.Item.scoreCardId)
          done()
        })
    }).timeout(20000)
  })

  describe('GET /reviewSummations', () => {
    it('Filtering all review summation should return all records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(5)
          _.map(res.body, 'id').should.have.members(_.map(ReviewSummations, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with isPassing true filter should return 3 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const passingRS = _.filter(ReviewSummations, (rt) => {
            return rt.isPassing === true
          })
          _.map(res.body, 'id').should.have.members(_.map(passingRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with isPassing false filter should return 2 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?isPassing=false`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const passingRS = _.filter(ReviewSummations, (rt) => {
            return rt.isPassing === false
          })
          _.map(res.body, 'id').should.have.members(_.map(passingRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with isFinal true filter should return 3 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?isFinal=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const nonFinalRS = _.filter(ReviewSummations, (rt) => {
            return rt.isFinal === true
          })
          _.map(res.body, 'id').should.have.members(_.map(nonFinalRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with isFinal false filter should return 2 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?isFinal=false`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const nonFinalRS = _.filter(ReviewSummations, (rt) => {
            return rt.isFinal === false
          })
          _.map(res.body, 'id').should.have.members(_.map(nonFinalRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with aggregateScore = 90 should return 2 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?aggregateScore=90`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredRS = _.filter(ReviewSummations, (rt) => {
            return rt.aggregateScore === 90
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with non existent aggregatescore should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?aggregateScore=35`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with submissionId should return that specific review summation', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?submissionId=e4d6ed7c-0310-4c2e-8223-17d3cfa8b310`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredRS = _.filter(ReviewSummations, (rt) => {
            return rt.submissionId === 'e4d6ed7c-0310-4c2e-8223-17d3cfa8b310'
          })
          _.isEqual(res.body, filteredRS).should.be.eql(true)
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with non existent submissionId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?submissionId=e4a6ed7c-0310-4c2e-8223-17d3cfa8b310`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with scorecardId should return records with that scorecardId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?scoreCardId=123456789`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const filteredRS = _.filter(ReviewSummations, (rt) => {
            return rt.scoreCardId === 123456789
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredRS, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with non existent scorecardId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?scoreCardId=1234567`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with aggregateScore = 90 and isFinal = true should return 1 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?aggregateScore=90&isFinal=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredRS = _.filter(ReviewSummations, (rt) => {
            return rt.aggregateScore === 90 && rt.isFinal === true
          })
          _.isEqual(res.body, filteredRS).should.be.eql(true)
          done()
        })
    }).timeout(20000)

    it('Filtering review summations with scorecardId and aggregateScore should return that specific record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?scoreCardId=123456789&aggregateScore=90`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredRS = _.filter(ReviewSummations, (rt) => {
            return rt.scoreCardId === 123456789 && rt.aggregateScore === 90
          })
          _.isEqual(res.body, filteredRS).should.be.eql(true)
          done()
        })
    }).timeout(20000)

    it('Filtering with non existent combination should return 0 records - Combination 1', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?scoreCardId=123456789&aggregateScore=50`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering with non existent combination should return 0 records - Combination 2', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?isPassing=true&submissionId=cfb5c40a-82dd-4826-8c46-0bccfaadc98e`)
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
