/*
 * Unit testing of Submission service with mocks
 */

/* eslint-disable handle-callback-err */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const config = require('config')
const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should() // eslint-disable-line
const app = require('../../app')
const {
  nonExSubmissionId, testSubmission
} = require('../common/testData')

chai.use(chaiHttp)

const binaryParser = function (res, cb) {
  res.setEncoding('binary')
  res.data = ''
  res.on('data', function (chunk) {
    res.data += chunk
  })
  res.on('end', function () {
    cb(null, Buffer.from(res.data, 'binary'))
  })
}

describe('Artifact Service tests', () => {
  /*
   * Test the POST /submissions/:submissionId/artifacts route
   */
  describe('POST /submissions/:submissionId/artifacts', () => {
    it('Creating submission artifact without body should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .send({})
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"files" is required')
          done()
        })
    })

    it('Creating invalid submission artifact should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions/b56a4180/artifacts`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .attach('artifact', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    })

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Creating submission artifact without token should throw 403', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .send({})
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Creating submission artifact with file upload with error name should throw 400', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .attach('submission', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('Artifact is missing or not under attribute `artifact`')
          done()
        })
    }).timeout(20000)

    it('Creating submission artifact with file upload should get succeeded', (done) => {
      chai.request(app)
        .post(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .attach('artifact', './test/common/fileToUpload.zip', 'fileToUpload.zip')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.artifact.should.be.eql('fileToUpload.zip.zip')
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /submissions/:submissionId/artifacts route
   */
  describe('GET /submissions/:submissionId/artifacts', () => {
    it('Getting invalid submission artifacts should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/b56a4180/artifacts`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    }).timeout(20000)

    it('Getting non-existing submission artifacts should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${nonExSubmissionId}/artifacts`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} does not exist`)
          done()
        })
    }).timeout(20000)

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting existing submission artifacts without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    }).timeout(20000)

    it('Getting existing submission artifacts with user token should return the submission artifacts', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.artifacts[0].should.be.eql('fileToUpload.zip')
          done()
        })
    }).timeout(20000)

    it('Getting existing submission artifacts with Admin token should return the submission artifacts', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.artifacts[0].should.be.eql('fileToUpload.zip')
          done()
        })
    }).timeout(20000)
  })

  /*
   * Test the GET /submissions/:submissionId/artifacts/:file/download route
   */
  describe('GET /submissions/:submissionId/artifacts/:file/download', () => {
    it('Getting submissions artifact file with invalid filter should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/b56a4180/artifacts/fileToUpload.zip/download`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql('"submissionId" must be a valid GUID')
          done()
        })
    }).timeout(20000)

    /*
     * TODO: Auth library ideally need to throw 401 for this scenario
     */
    it('Getting submissions artifact file without token should throw 403', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip/download`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    }).timeout(20000)

    it('Getting non-existent submission artifact file in empty Bucket should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/nonExistentFile.zip/download`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql(`Artifact nonExistentFile.zip doesn't exist for ${testSubmission.Item.id}`)
          done()
        })
    }).timeout(20000)

    it('Getting non-existent submission artifact file should throw 400', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/existentFile.zip/download`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(400)
          res.body.message.should.be.eql(`Artifact existentFile.zip doesn't exist for ${testSubmission.Item.id}`)
          done()
        })
    }).timeout(20000)

    it('Getting submissions artifact file with user token should return the submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip/download`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .buffer()
        .parse(binaryParser)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.to.equal(151)
          done()
        })
    }).timeout(20000)

    it('Getting submissions artifact file with Admin token should return the submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip/download`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .buffer()
        .parse(binaryParser)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.length.should.to.equal(151)
          done()
        })
    }).timeout(20000)
  })
  /*
   * Test the DELETE /submissions/:submissionId/artifacts/:file route
   */
  describe('DELETE /submissions/:submissionId/artifacts/:file', () => {
    it('Deleting invalid submission artifact should throw 400', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/b56a4180/artifacts/fileToUpload.zip`)
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
    it('Deleting submission artifact without token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip`)
        .end((err, res) => {
          res.should.have.status(403)
          done()
        })
    })

    it('Deleting submission artifact with user token should throw 403', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip`)
        .set('Authorization', `Bearer ${config.USER_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(403)
          res.body.message.should.be.eql('You are not allowed to perform this action!')
          done()
        })
    }).timeout(20000)

    it('Deleting non-existent submission artifact should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/nonExistentFile.zip`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Artifact nonExistentFile.zip doesn't exist for submission ID: ${testSubmission.Item.id}`)
          done()
        })
    }).timeout(20000)

    it('Deleting non-existent submission should throw 404', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Deleting submission artifact with Admin token should get succeeded', (done) => {
      chai.request(app)
        .delete(`${config.API_VERSION}/submissions/${testSubmission.Item.id}/artifacts/fileToUpload.zip`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    }).timeout(20000)
  })
})
