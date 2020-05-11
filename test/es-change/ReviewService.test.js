/*
 * Review service ES change related tests
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
const { nonExReviewId, testReview } = require('../common/testData')
const Reviews = require('../../scripts/data/Reviews.json')

coMocha(mocha)
chai.use(chaiHttp)

describe('Review Service tests', () => {
  describe('GET /reviews/:reviewId', () => {
    it('Getting non-existing review should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/${nonExReviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review with ID = ${nonExReviewId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Getting existing review should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/${testReview.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReview.Item))
          res.body.id.should.be.eql(testReview.Item.id)
          res.body.score.should.be.eql(testReview.Item.score)
          res.body.status.should.be.eql(testReview.Item.status)
          res.body.legacyReviewId.should.be.eql(testReview.Item.legacyReviewId)
          res.body.reviewerId.should.be.eql(testReview.Item.reviewerId)
          res.body.submissionId.should.be.eql(testReview.Item.submissionId)
          res.body.scoreCardId.should.be.eql(testReview.Item.scoreCardId)
          res.body.typeId.should.be.eql(testReview.Item.typeId)
          done()
        })
    }).timeout(20000)
  })

  describe('GET /reviews', () => {
    it('Filtering all reviews should return all records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(10)
          _.map(res.body, 'id').should.have.members(_.map(Reviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with score 100 should return 2 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?score=100`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.score === 100
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent score should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?score=35`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with scorecardId should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?scoreCardId=123456789`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(6)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.scoreCardId === 123456789
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent scorecardId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?scoreCardId=52764`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with legacyReviewId should return appropriate record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?legacyReviewId=1234567896`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.legacyReviewId === 1234567896
          })
          _.isEqual(res.body, filteredReviews).should.be.eql(true)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent legacyReviewId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?legacyReviewId=4567896`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with typeId should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?typeId=f28b2725-ef90-4495-af59-ceb2bd98fc10`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.typeId === 'f28b2725-ef90-4495-af59-ceb2bd98fc10'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent typeId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?typeId=a28b2725-ef90-4495-af59-ceb2bd98fc10`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with reviewerId should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(8)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent reviewerId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?reviewerId=c25a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with submissionId should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?submissionId=a12a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.submissionId === 'a12a4180-65aa-42ec-a945-5fd21dec0503'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent submissionId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?submissionId=a13a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with status completed should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?status=completed`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(9)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.status === 'completed'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with status queued should return records properly', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?status=queued`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.status === 'queued'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with score and scoreCardId should return appropriate records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?score=100&scoreCardId=85779`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.score === 100 && review.scoreCardId === 85779
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with status and reviewerId should return appropriate records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?status=queued&reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.status === 'queued' && review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with legacyReviewId and submissionId should return appropriate records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?legacyReviewId=1234567893&submissionId=a12a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredReviews = _.filter(Reviews, (review) => {
            return review.legacyReviewId === 1234567893 && review.submissionId === 'a12a4180-65aa-42ec-a945-5fd21dec0503'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredReviews, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent combination should return 0 records - Combination 1', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?legacyReviewId=1234567897&submissionId=a12a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent combination should return 0 records - Combination 2', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?score=92.5&scoreCardId=78234`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent combination should return 0 records - Combination 3', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?status=queued&submissionId=a12a4180-65aa-42ec-a945-5fd21dec0501`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering reviews with non existent combination should return 0 records - Combination 4', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0502&typeId=c56a4180-65aa-42ec-a945-5fd21dec0501`)
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
