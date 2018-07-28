/*
 * Review Summation service test
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
const { nonExReviewSummationId, testReviewSummation,
  testReviewSummationPatch, testSubmission } = require('../common/testData')
const { loadReviewSummations } = require('../../scripts/ESloadHelper')

coMocha(mocha)
chai.use(chaiHttp)

let submissionId
let reviewSummationId // Used to store reviewSummationId after creating review summation

describe('Review Summation Service tests', () => {
  // Before hook to load ES
  before(function * () {
    this.timeout(20000)
    yield loadReviewSummations()
    const submission = yield chai.request(app)
      .post(`${config.API_VERSION}/submissions`)
      .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
      .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
    submissionId = submission.body.id
  })

  /*
   * Test the POST /reviewSummations route
   */
  describe('POST /reviewSummations', () => {
    it('Creating ReviewSummation without body should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"scoreCardId" is required')
          done()
        })
    })

    it('Creating ReviewSummation without all fields should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummation.Item, ['scoreCardId']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" is required')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Creating ReviewSummation without token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewSummations`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Creating ReviewSummation with user token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReviewSummation.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Creating ReviewSummation with Admin token should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ submissionId: submissionId }, _.omit(testReviewSummation.Item, ['id', 'submissionId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummation.Item))
          res.body.id.should.not.be.eql(null)
          reviewSummationId = res.body.id // To be used in future requests
          res.body.aggregateScore.should.be.eql(testReviewSummation.Item.aggregateScore)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReviewSummation.Item.scoreCardId)
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the GET /reviewSummations/:reviewSummationId route
   */
  describe('GET /reviewSummations/:reviewSummationId', () => {
    it('Getting invalid ReviewSummation should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewSummationId" must be a valid GUID')
          done()
        })
    })

    it('Getting non-existing ReviewSummation should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${nonExReviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review summation with ID = ${nonExReviewSummationId} is not found`)
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting existing ReviewSummation without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting existing ReviewSummation with user token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Getting existing ReviewSummation with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummation.Item))
          res.body.id.should.be.eql(reviewSummationId)
          res.body.aggregateScore.should.be.eql(testReviewSummation.Item.aggregateScore)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReviewSummation.Item.scoreCardId)
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the PUT /reviewSummations/:reviewSummationId route
   */
  describe('PUT /reviewSummations/:reviewSummationId', () => {
    it('Updating ReviewSummation without body should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"scoreCardId" is required')
          done()
        })
    })

    it('Updating ReviewSummation without all fields should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummation.Item, ['scoreCardId']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" is required')
          done()
        })
    })

    it('Updating invalid ReviewSummation should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewSummation.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewSummationId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Updating ReviewSummation without token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Updating ReviewSummation with user token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testReviewSummation.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Updating non-existent ReviewSummation should throw 404', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${nonExReviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testReviewSummation.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review summation with ID = ${nonExReviewSummationId} is not found`)
          done()
        })
    })

    it('Updating ReviewSummation with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.extend({ submissionId: submissionId }, _.omit(testReviewSummation.Item, ['id', 'submissionId', 'created', 'updated', 'createdBy', 'updatedBy'])))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummation.Item))
          res.body.id.should.be.eql(reviewSummationId)
          res.body.aggregateScore.should.be.eql(testReviewSummation.Item.aggregateScore)
          res.body.submissionId.should.be.eql(submissionId)
          res.body.scoreCardId.should.be.eql(testReviewSummation.Item.scoreCardId)
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the PATCH /reviewSummations/:reviewSummationId route
   */
  describe('PATCH /reviewSummations/:reviewSummationId', () => {
    it('Patching invalid ReviewSummation should throw 400', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummation.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewSummationId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Patching ReviewSummation without token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Patching ReviewSummation with user token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.pick(testReviewSummation.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Patching non-existent ReviewSummation should throw 404', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/${nonExReviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummation.Item, ['score']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review summation with ID = ${nonExReviewSummationId} is not found`)
          done()
        })
    })

    it('Patching ReviewSummation with one set of fields Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummationPatch.Item, ['aggregateScore']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummationPatch.Item))
          res.body.id.should.be.eql(reviewSummationId)
          res.body.aggregateScore.should.be.eql(testReviewSummationPatch.Item.aggregateScore)
          done()
        })
    }).timeout(10000)

    it('Patching ReviewSummation with another set of fields Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testReviewSummationPatch.Item, ['scoreCardId', 'isPassing']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testReviewSummationPatch.Item))
          res.body.id.should.be.eql(reviewSummationId)
          res.body.scoreCardId.should.be.eql(testReviewSummationPatch.Item.scoreCardId)
          res.body.isPassing.should.be.eql(testReviewSummationPatch.Item.isPassing)
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the DELETE /reviewSummations/:reviewSummationId route
   */
  describe('DELETE /reviewSummations/:reviewSummationId', () => {
    it('Deleting invalid ReviewSummation should throw 400', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewSummations/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"reviewSummationId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Deleting ReviewSummation without token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting ReviewSummation with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Deleting non-existent ReviewSummation should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewSummations/${nonExReviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Review summation with ID = ${nonExReviewSummationId} is not found`)
          done()
        })
    })

    it('Deleting ReviewSummation with Admin token should get succeeded', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/reviewSummations/${reviewSummationId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the GET /reviewSummations route
   */
  describe('GET /reviewSummations', () => {
    it('Getting reviewSummations with invalid filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations?test=abc`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"test" is not allowed')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting reviewSummations without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting reviewSummations with user token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Getting reviewSummations with Admin token should return the record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/reviewSummations`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(4)
          done()
        })
    }).timeout(10000)
  })
})
