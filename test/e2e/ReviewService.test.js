/*
 * Review service test
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const _ = require('lodash')
const chai = require('chai')
const chaiHttp = require('chai-http')
const mocha = require('mocha')
const coMocha = require('co-mocha')
const should = chai.should() // eslint-disable-line
const app = require('../../app')
const {
  nonExReviewId, testReview, nonExSubmissionId,
  nonExReviewTypeId, testReviewPatch, testSubmission,
  testReviewType
} = require('../common/testData')
const { loadReviews } = require('../../scripts/ESloadHelper')

coMocha(mocha)
chai.use(chaiHttp)

let reviewTypeId
let submissionId
let reviewId // Used to store reviewId after creating review

describe('Review Service tests', () => {
  // Before hook to load ES
  before(async function () {
    this.timeout(25000)
    await loadReviews()
    const reviewType = await chai.request(app)
      .post(`${config.API_VERSION}/reviewTypes`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .send(_.omit(testReviewType.Item, ['id']))
    reviewTypeId = reviewType.body.id
    const submission = await chai.request(app)
      .post(`${config.API_VERSION}/submissions`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
    submissionId = submission.body.id
  })

  /*
   * Test the POST /reviews route
   */
  describe('POST /reviews', () => {
    it('Creating review without body should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"score" is required')
          done()
        })
    })

    it('Creating review without all fields should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReview.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"typeId" is required')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Creating review without token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Creating review with user token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReview.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Creating review with invalid submissionId should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ typeId: reviewTypeId, submissionId: nonExSubmissionId }, _.omit(testReview.Item, ['id', 'typeId', 'submissionId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} does not exist`)
          done()
        })
    }).timeout(20000)

    it('Creating review with invalid typeId should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ typeId: nonExReviewTypeId }, _.omit(testReview.Item, ['id', 'typeId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql(`Review type with ID = ${nonExReviewTypeId} does not exist`)
          done()
        })
    }).timeout(20000)

    it('Creating review with Admin token should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ typeId: reviewTypeId, submissionId: submissionId }, _.omit(testReview.Item, ['id', 'typeId', 'submissionId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReview.Item))
          res.body.id.should.not.be.eql(null)
          reviewId = res.body.id
          res.body.score.should.be.eql(testReview.Item.score)
          res.body.reviewerId.should.be.eql(testReview.Item.reviewerId)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReview.Item.scoreCardId)
          res.body.typeId.should.be.eql(reviewTypeId)
          res.body.status.should.be.eql(testReview.Item.status)
          done()
        })
    }).timeout(20000)

    it('Creating review without status should be created with status "completed"', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ typeId: reviewTypeId, submissionId: submissionId }, _.omit(testReview.Item, ['id', 'typeId', 'submissionId', 'status', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReview.Item))
          res.body.id.should.not.be.eql(null)
          reviewId = res.body.id
          res.body.score.should.be.eql(testReview.Item.score)
          res.body.reviewerId.should.be.eql(testReview.Item.reviewerId)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReview.Item.scoreCardId)
          res.body.typeId.should.be.eql(reviewTypeId)
          res.body.status.should.be.eql('completed')
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /reviews/:reviewId route
   */
  describe('GET /reviews/:reviewId', () => {
    it('Getting invalid review should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewId" must be a valid GUID')
          done()
        })
    })

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

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting existing review without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/${reviewId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting existing review with user token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Getting existing review with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews/${testReview.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReview.Item))
          res.body.id.should.be.eql(testReview.Item.id)
          res.body.score.should.be.eql(testReview.Item.score)
          res.body.reviewerId.should.be.eql(testReview.Item.reviewerId)
          res.body.submissionId.should.be.eql(testReview.Item.submissionId)
          res.body.scoreCardId.should.be.eql(testReview.Item.scoreCardId)
          res.body.typeId.should.be.eql(testReview.Item.typeId)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PUT /reviews/:reviewId route
   */
  describe('PUT /reviews/:reviewId', () => {
    it('Updating review without body should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"score" is required')
          done()
        })
    })

    it('Updating review without all fields should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReview.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"typeId" is required')
          done()
        })
    })

    it('Updating invalid review should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReview.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Updating review without token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${reviewId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Updating review with user token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReview.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Updating non-existent review should throw 404', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${nonExReviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReview.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review with ID = ${nonExReviewId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Updating review with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ typeId: reviewTypeId, submissionId: submissionId }, _.omit(testReview.Item, ['id', 'typeId', 'submissionId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReview.Item))
          res.body.id.should.be.eql(reviewId)
          res.body.score.should.be.eql(testReview.Item.score)
          res.body.reviewerId.should.be.eql(testReview.Item.reviewerId)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReview.Item.scoreCardId)
          res.body.typeId.should.be.eql(reviewTypeId)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PATCH /reviews/:reviewId route
   */
  describe('PATCH /reviews/:reviewId', () => {
    it('Patching invalid review should throw 400', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReview.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Patching review without token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/${reviewId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Patching review with user token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.pick(testReview.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Patching non-existent review should throw 404', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/${nonExReviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReview.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review with ID = ${nonExReviewId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Patching review with one set of fields using Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewPatch.Item, ['score', 'reviewerId']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewPatch.Item))
          res.body.id.should.be.eql(reviewId)
          res.body.score.should.be.eql(testReviewPatch.Item.score)
          res.body.reviewerId.should.be.eql(testReviewPatch.Item.reviewerId)
          done()
        })
    }).timeout(20000)

    it('Patching review with another set of fields using Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewPatch.Item, ['scoreCardId']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewPatch.Item))
          res.body.id.should.be.eql(reviewId)
          res.body.scoreCardId.should.be.eql(testReviewPatch.Item.scoreCardId)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the DELETE /reviews/:reviewId route
   */
  describe('DELETE /reviews/:reviewId', () => {
    it('Deleting invalid review should throw 400', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviews/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Deleting review without token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviews/${reviewId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting review with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Deleting non-existent review should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviews/${nonExReviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review with ID = ${nonExReviewId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Deleting review with Admin token should get succeeded', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /reviews route
   */
  describe('GET /reviews', () => {
    it('Getting reviews with invalid filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?test=abc`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"test" is not allowed')
          done()
        })
    })

    it('Getting reviews with orderBy without sortBy filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews?orderBy=asc`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"orderBy" missing required peer "sortBy"')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting reviews without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting reviews with user token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Getting reviews with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviews`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(4)
          done()
        })
    }).timeout(20000)
  })
})
