/*
 * Submission service test
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
const { nonExSubmissionId, testSubmissionWoLegacy } = require('../common/testData')
const Submissions = require('../../scripts/data/Submissions.json')

coMocha(mocha)
chai.use(chaiHttp)

describe('Submission Service tests', () => {
  describe('GET /submissions/:submissionId', () => {
    it('Getting non existent submission should throw 404', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${nonExSubmissionId}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.message.should.be.eql(`Submission with ID = ${nonExSubmissionId} is not found`)
          done()
        })
    }).timeout(20000)

    it('Getting existing submission should return the submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions/${testSubmissionWoLegacy.Item.id}`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.all.keys(_.concat(Object.keys(testSubmissionWoLegacy.Item), 'review', 'reviewSummation'))
          res.body.id.should.be.eql(testSubmissionWoLegacy.Item.id)
          res.body.challengeId.should.be.eql(testSubmissionWoLegacy.Item.challengeId)
          res.body.type.should.be.eql(testSubmissionWoLegacy.Item.type)
          done()
        })
    }).timeout(50000)
  })

  describe('GET /submissions', () => {
    it('Filtering all submissions should return all submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(10)
          _.map(res.body, 'id').should.have.members(_.map(Submissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with type ContestSubmission should return 9 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?type=ContestSubmission`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(9)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.type === 'ContestSubmission'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid type should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?type=dummy`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with a valid url should return 1 record', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?url=https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123464`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.url === 'https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=123464'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid url should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?url=https://software.topcoder.com/review/actions/DownloadContestSubmission?uid=3464`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with memberId should return the member submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?memberId=c6c5e4de-401e-4c9b-891f-26a518f37c7a`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.memberId === 'c6c5e4de-401e-4c9b-891f-26a518f37c7a'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid memberId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?memberId=c8c5e4de-401e-4c9b-891f-26a518f37c7a`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId should return submissions from that challenge', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(4)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid challengeId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=63454`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with legacySubmissionId should return that specific submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?legacySubmissionId=301234`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.legacySubmissionId === 301234
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid legacySubmissionId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?legacySubmissionId=63454`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with legacyUploadId should return that specific submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?legacyUploadId=483345`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.legacyUploadId === 483345
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid legacyUploadId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?legacyUploadId=63454`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with submissionPhaseId should return submissions submitted during that phase id', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?submissionPhaseId=12879`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(5)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.submissionPhaseId === 12879
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with invalid submissionPhaseId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?submissionPhaseId=63454`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.score should return submissions which has review with that score', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.score=100`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.score === 100) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.score should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.score=35`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.legacyReviewId should return submission which has review with that legacyReviewId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.legacyReviewId=1234567899`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.legacyReviewId === 1234567899) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.legacyReviewId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.legacyReviewId=54872`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.typeId should return submissions which has review with that typeId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.typeId=c56a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(5)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.typeId === 'c56a4180-65aa-42ec-a945-5fd21dec0503') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.typeId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.typeId=c32a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.reviewerId should return submissions with reviews done by that reviewer', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(6)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.reviewerId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.reviewerId=c32a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.scoreCardId should return submissions with reviews having that scorecardId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.scoreCardId=234234`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.scoreCardId === 234234) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.scoreCardId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.scoreCardId=578896`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.submissionId should return submissions with reviews linked to that submissionId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.submissionId=a12a4180-65aa-42ec-a945-5fd21dec0504`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.submissionId === 'a12a4180-65aa-42ec-a945-5fd21dec0504') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent review.submissionId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.submissionId=c32a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.status completed should return submissions with completed reviews', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.status=completed`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(5)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.status === 'completed') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.status queued should return submissions with pending / queued reviews', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.status=queued`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.status === 'queued') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with reviewSummation.scoreCardId should return submissions with reviews linked to that scoreCardId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.scoreCardId=123456789`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.scoreCardId === 123456789) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent reviewSummation.scoreCardId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.scoreCardId=57453`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with reviewSummation.submissionId should return submissions with reviews linked to that submissionId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.submissionId=cfb5c40a-82dd-4826-8c46-0bccfaadc98e`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.submissionId === 'cfb5c40a-82dd-4826-8c46-0bccfaadc98e') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent reviewSummation.submissionId should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.submissionId=c32a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with reviewSummation.aggregateScore should return submissions with reviews linked to that submissionId', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.aggregateScore=90`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.aggregateScore === 90) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent reviewSummation.aggregateScore should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.aggregateScore=35`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with reviewSummation.isPassing true filter should return submissions with passing review summations', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(3)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.isPassing === true) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with reviewSummation.isPassing false filter should return submissions with passing review summations', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?reviewSummation.isPassing=false`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.isPassing === false) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId and legacySubmissionId should return that specific submission', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443&legacySubmissionId=301240`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443 && submission.legacySubmissionId === 301240
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId and type should return appropriate submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443&type=Task`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443 && submission.type === 'Task'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with submissionPhaseId and memberId should return appropriate submissions', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?submissionPhaseId=12879&memberId=c6c5e4de-401e-4c9b-891f-26a518f37c7a`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.submissionPhaseId === 12879 && submission.memberId === 'c6c5e4de-401e-4c9b-891f-26a518f37c7a'
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId and review.reviewerId should return submissions with reviews done by that reviewer from that challenge', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443&review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443 &&
                  _.find(submission.review, (review) => review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503') !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId and reviewSummation.isPassing true should return passing submissions from that challenge', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443&reviewSummation.isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443 &&
                  _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.isPassing === true) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with review.reviewerId and reviewSummation.isPassing true should return passing submissions from that reviewer', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503&reviewSummation.isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(2)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return _.find(submission.review, (review) => review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503') !== undefined &&
                  _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.isPassing === true) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with challengeId and eview.reviewerId and reviewSummation.isPassing true should return passing submissions from that reviewer in that challenge', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30023443&review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503&reviewSummation.isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(1)
          const filteredSubmissions = _.filter(Submissions, (submission) => {
            return submission.challengeId === 30023443 &&
                  _.find(submission.review, (review) => review.reviewerId === 'c23a4180-65aa-42ec-a945-5fd21dec0503') !== undefined &&
                  _.find(submission.reviewSummation, (reviewSummation) => reviewSummation.isPassing === true) !== undefined
          })
          _.map(res.body, 'id').should.have.members(_.map(filteredSubmissions, 'id'))
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30051825&review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503&reviewSummation.isPassing=true`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?review.reviewerId=c23a4180-65aa-42ec-a945-5fd21dec0503&reviewSummation.isPassing=false`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?challengeId=30051825&reviewSummation.scoreCardId=88633`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?memberId=5d0a2759-949d-4987-908d-12d747836343&review.score=92.5`)
        .set('Authorization', `Bearer ${config.ADMIN_TOKEN}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('array')
          res.body.length.should.be.eql(0)
          done()
        })
    }).timeout(20000)

    it('Filtering submissions with non existent combination should return 0 records', (done) => {
      chai.request(app)
        .get(`${config.API_VERSION}/submissions?legacySubmissionId=301231&legacyUploadId=483342`)
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
