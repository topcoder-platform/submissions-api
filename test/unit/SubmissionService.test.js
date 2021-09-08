/*
 * Unit testing of Submission service with mocks
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const _ = require('lodash')
const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should() // eslint-disable-line
const app = require('../../app')
const {
  nonExSubmissionId, testSubmission,
  testSubmissionPatch
} = require('../common/testData')

chai.use(chaiHttp)

describe('Submission Service tests', () => {
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
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Getting existing submission with user token should return the submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.omit(testSubmission.Item, ['submittedDate'])))
          res.body.id.should.be.eql(testSubmission.Item.id)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    })

    it('Getting existing submission with Admin token should return the submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(Object.keys(_.omit(testSubmission.Item, ['submittedDate'])))
          res.body.id.should.be.eql(testSubmission.Item.id)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    })
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
        .send(_.omit(testSubmission.Item, ['id', 'url', 'created', 'updated', 'createdBy', 'updatedBy', 'review', 'reviewSummation']))
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
        .attach('submission', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('Either file to be uploaded or URL should be present')
          done()
        })
    })

    it('Creating submission with file upload and mismatching fileType should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .field('challengeId', testSubmission.Item.challengeId)
        .field('type', testSubmission.Item.type)
        .field('memberId', testSubmission.Item.memberId)
        .field('fileType', 'pdf')
        .attach('submission', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('fileType parameter doesn\'t match the type of the uploaded file')
          done()
        })
    })

    it('Creating submission with file upload should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .field('challengeId', testSubmission.Item.challengeId)
        .field('type', testSubmission.Item.type)
        .field('memberId', testSubmission.Item.memberId)
        .field('fileType', 'zip')
        .attach('submission', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.extend({ legacyChallengeId: '', v5ChallengeId: '', fileType: 'zip', submissionPhaseId: 733196, submittedDate: '2018-05-20T07:00:30.123Z' }, _.omit(testSubmission.Item, ['legacySubmissionId', 'review', 'reviewSummation']))))
          res.body.id.should.not.be.eql(null)
          res.body.v5ChallengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.not.be.eql(null)
          res.body.memberId.should.be.eql(testSubmission.Item.memberId)
          res.body.fileType.should.be.eql('zip')
          res.body.submissionPhaseId.should.be.eql('6950164f-3c5e-4bdc-abc8-22aaf5a1bd49')
          done()
        })
    })

    it('Creating submission with Simulated S3 upload error', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .field('challengeId', testSubmission.Item.challengeId)
        .field('type', testSubmission.Item.type)
        .field('memberId', testSubmission.Item.memberId)
        .attach('submission', './test/common/fileToUpload.zip', 'error')
        .end((err, res) => {
          res.should.have.status(500)
          done()
        })
    })

    it('Creating submission with url passing should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy', 'review', 'reviewSummation']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.extend({ legacyChallengeId: '', v5ChallengeId: '', fileType: 'zip', submissionPhaseId: 733196, submittedDate: '2018-05-20T07:00:30.123Z' }, _.omit(testSubmission.Item, ['review', 'reviewSummation']))))
          res.body.id.should.not.be.eql(null)
          res.body.v5ChallengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          res.body.fileType.should.be.eql('zip')
          done()
        })
    }).timeout(10000)

    it('Creating submission with url passing and without submissionPhaseId should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy', 'submissionPhaseId', 'review', 'reviewSummation']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.extend({ legacyChallengeId: '', v5ChallengeId: '', fileType: 'zip', submissionPhaseId: 733196, submittedDate: '2018-05-20T07:00:30.123Z' }, _.omit(testSubmission.Item, ['review', 'reviewSummation']))))
          res.body.id.should.not.be.eql(null)
          res.body.v5ChallengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          res.body.fileType.should.be.eql('zip')
          done()
        })
    }).timeout(10000)
  })

  /*
   * Test the PUT /submissions/:submissionId route
   */
  describe('PUT /submissions/:submissionId', () => {
    it('Updating submission without body should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"url" is required')
          done()
        })
    })

    it('Updating submission without all fields should throw 400', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
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
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Updating submission with user token should throw 403', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
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
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy', 'review', 'reviewSummation']))
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    })

    it('Updating submission with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy', 'review', 'reviewSummation']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.extend({ submissionPhaseId: 733196 }, _.omit(testSubmission.Item, ['review', 'reviewSummation', 'submittedDate', 'v5ChallengeId']))))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    }).timeout(10000)

    it('Updating submission without legacy fields with Admin token should get succeeded', (done) => {
      chai.request(app)
        .put(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.omit(testSubmission.Item, ['id', 'created', 'updated', 'createdBy', 'updatedBy', 'review', 'reviewSummation']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(_.extend({ submissionPhaseId: 733196 }, _.omit(testSubmission.Item, ['review', 'reviewSummation', 'submittedDate', 'v5ChallengeId']))))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmission.Item.challengeId)
          res.body.type.should.be.eql(testSubmission.Item.type)
          res.body.url.should.be.eql(testSubmission.Item.url)
          done()
        })
    }).timeout(10000)
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
        .patch(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Patching submission with user token should throw 403', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
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
    it('Patching submission with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${testSubmissionPatch.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmissionPatch.Item, ['type', 'url']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmissionPatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmissionPatch.Item.challengeId)
          res.body.type.should.be.eql(testSubmissionPatch.Item.type)
          res.body.url.should.be.eql(testSubmissionPatch.Item.url)
          done()
        })
    }).timeout(10000)
    // Patching different set of fields for test coverage
    it('Patching submission with Admin token should get succeeded', (done) => {
      chai.request(app)
        .patch(`${config.API_VERSION}/submissions/${testSubmissionPatch.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send(_.pick(testSubmissionPatch.Item, ['legacySubmissionId', 'submissionPhaseId']))
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.keys(Object.keys(testSubmissionPatch.Item))
          res.body.id.should.not.be.eql(null)
          res.body.challengeId.should.be.eql(testSubmissionPatch.Item.challengeId)
          res.body.legacySubmissionId.should.be.eql(testSubmissionPatch.Item.legacySubmissionId)
          res.body.submissionPhaseId.should.be.eql(testSubmissionPatch.Item.submissionPhaseId)
          done()
        })
    }).timeout(10000)
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
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting submission with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
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
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(10000)
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

    it('Getting submissions with orderBy without sortBy filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?orderBy=asc`)
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
    })

    it('Getting submissions with Admin token should return the submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.be.eql(5)
          done()
        })
    })

    it('Getting submissions with Admin token should include review.metadata.public and review.metadata.private', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.nested.property('[0].review[0].metadata.public')
          res.body.should.have.nested.property('[0].review[0].metadata.private')
          done()
        })
    })

    it('Getting submissions with Copilot token should include review.metadata.public and review.metadata.private', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.COPILOT_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.nested.property('[0].review[0].metadata.public')
          res.body.should.have.nested.property('[0].review[0].metadata.private')
          done()
        })
    })

    it('Getting submissions with User token should include review.metadata.public but not review.metadata.private', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.nested.property('[0].review[0].metadata.public')
          res.body.should.not.have.nested.property('[0].review[0].metadata.private')
          done()
        })
    })
  })
})
