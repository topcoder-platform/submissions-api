/*
 * Submission service test
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
const { nonExSubmissionId, testSubmission, testSubmissionWoLegacy,
  testSubmissionPatch } = require('../common/testData')
const { loadSubmissions } = require('../../scripts/ESloadHelper')

coMocha(mocha)
chai.use(chaiHttp)

let submissionId // Used to store submissionId after creating submission

describe('Submission Service tests', () => {
  // Before hook to load ES
  before(function * () {
    yield loadSubmissions()
  })

  /*
   * Test the POST /submissions route
   */
  describe('POST /submissions', () => {
    it('Creating submission without body should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"type" is required')
          done()
        })
    })

    it('Creating submission without all fields should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmission.Item, ['type']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"memberId" is required')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Creating submission without token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Creating submission without both url and files should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'url', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('Either file to be uploaded or URL should be present')
          done()
        })
    })

    it('Creating submission with both url and files should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .field('url', testSubmission.Item.url)
        .field('challengeId', testSubmission.Item.challengeId)
        .field('type', testSubmission.Item.type)
        .field('memberId', testSubmission.Item.memberId)
        .attach('submission', './test/common/fileToUpload.txt', 'fileToUpload.txt')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('Either file to be uploaded or URL should be present')
          done()
        })
    })

    it('Creating submission with file upload should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .field('challengeId', testSubmissionWoLegacy.Item.challengeId)
        .field('type', testSubmissionWoLegacy.Item.type)
        .field('memberId', testSubmissionWoLegacy.Item.memberId)
        .attach('submission', './test/common/fileToUpload.txt', 'fileToUpload.txt')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmissionWoLegacy.Item))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmissionWoLegacy.Item.challengeId)
          res.body.type.should.be.eql(testSubmissionWoLegacy.Item.type)
          res.body.url.should.not.be.eql(null)
          res.body.memberId.should.be.eql(testSubmissionWoLegacy.Item.memberId)
          done()
        })
    }).timeout(20000)

    it('Creating submission with url passing should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmission.Item))
          res.body.id.should.not.be.eql(null)
          submissionId = res.body.id // To be used in future requests
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /submissions/:submissionId route
   */
  describe('GET /submissions/:submissionId', () => {
    it('Getting invalid submission should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    })

    it('Getting non-existing submission should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting existing submission without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${submissionId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting existing submission with user token should return the submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmission.Item))
          res.body.id.should.be.eql(submissionId)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    })

    it('Getting existing submission with Admin token should return the submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(testSubmission.Item))
          res.body.id.should.be.eql(submissionId)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PUT /submissions/:submissionId route
   */
  describe('PUT /submissions/:submissionId', () => {
    it('Updating submission without body should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"type" is required')
          done()
        })
    })

    it('Updating submission without all fields should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmission.Item, ['type']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"url" is required')
          done()
        })
    })

    it('Updating invalid submission should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Updating submission without token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Updating submission with user token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Updating non-existent submission should throw 404', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    })

    it('Updating submission with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmission.Item))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    }).timeout(20000)

    it('Updating submission without legacy fields with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmissionWoLegacy.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmission.Item))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmissionWoLegacy.Item.challengeId)
          res.body.type.should.be.eql(testSubmissionWoLegacy.Item.type)
          res.body.url.should.be.eql(testSubmissionWoLegacy.Item.url)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the PATCH /submissions/:submissionId route
   */
  describe('PATCH /submissions/:submissionId', () => {
    it('Patching invalid submission should throw 400', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id']))
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Patching submission without token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${submissionId}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Patching submission with user token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Patching non-existent submission should throw 404', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    })
    // Patching 2 fields
    it('Patching submission(one set of fields) with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmissionPatch.Item, ['type', 'url']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmissionPatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.type.should.be.eql(testSubmissionPatch.Item.type)
          res.body.url.should.be.eql(testSubmissionPatch.Item.url)
          done()
        })
    }).timeout(20000)
    // Patching different set of fields for test coverage
    it('Patching submission(another set of fields) with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmissionPatch.Item, ['legacySubmissionId', 'submissionPhaseId']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmissionPatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.legacySubmissionId.should.be.eql(testSubmissionPatch.Item.legacySubmissionId)
          res.body.submissionPhaseId.should.be.eql(testSubmissionPatch.Item.submissionPhaseId)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the DELETE /submissions/:submissionId route
   */
  describe('DELETE /submissions/:submissionId', () => {
    it('Deleting invalid submission should throw 400', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/b56a4180`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Deleting submission without token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${submissionId}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting submission with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    })

    it('Deleting non-existent submission should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    })

    it('Deleting submission with Admin token should get succeeded', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /submissions route
   */
  describe('GET /submissions', () => {
    it('Getting submissions with invalid filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?test=abc`)
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
    it('Getting submissions without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting submissions with user token should return the submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(5)
          done()
        })
    }).timeout(20000)

    it('Getting submissions with Admin token should return the submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(5)
          done()
        })
    }).timeout(20000)
  })
})
