/**
 * This service provides operations to clean up the environment for running automated tests.
 */
const _ = require('lodash')
const config = require('config')
// const helper = require('../common/helper')
const logger = require('../common/logger')
const artifactService = require('./ArtifactService')
const dbHelper = require('../common/dbhelper')

/**
  * Delete the Resource from the ES by the given id
  * @param id the resource id
  * @returns {Promise<void>}
  */
// const deleteFromESById = async (id) => {
//   // delete from ES
//   const esClient = await helper.getEsClient()
//   await esClient.delete({
//     index: config.ES.ES_INDEX,
//     type: config.ES.ES_TYPE,
//     id: id,
//     refresh: 'true' // refresh ES so that it is effective for read operations instantly
//   })
// }

/**
  * Clear the postman test data. The main function of this class.
  * @returns {Promise<void>}
  */
const cleanUpTestData = async () => {
  logger.info('clear the test data from postman test!')
  // get all sibmissions
  let submissions = await dbHelper.scanRecords({
    TableName: 'Submission'
  })
  // filter out the submissions to only include the postman test submissions
  submissions = _.filter(submissions, s => (s.type.startsWith(config.AUTOMATED_TESTING_NAME_PREFIX)))
  for (let submission of submissions) {
    // delete all the reviews from the submission
    await dbHelper.deleteRecord({
      TableName: 'Review',
      Key: {
        submissionId: submission.id
      }
    })

    // delete ReviewSummations for the submission
    await dbHelper.deleteRecord({
      TableName: 'ReviewSummation',
      Key: {
        submissionId: submission.id
      }
    })

    // get the list of artifcats for the submission
    let artifacts = artifactService.listArtifacts(submission.id)
    for (let artifact of artifacts) {
      artifactService.deleteArtifact(submission.id, artifact)
    }

    // delete from elastic search
    // await deleteFromESById(submission.id)

    // delete submission
    await submission.delete()
  }

  // get all review types
  let reviewTypes = await dbHelper.scanRecords({
    TableName: 'ReviewType'
  })
  reviewTypes = _.filter(reviewTypes, r => (r.name.startsWith(config.AUTOMATED_TESTING_NAME_PREFIX)))
  for (let type of reviewTypes) {
    // delete review type
    type.delete()
  }
  logger.info('clear the test data from postman test completed!')
}

module.exports = {
  cleanUpTestData
}
