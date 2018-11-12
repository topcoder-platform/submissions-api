/*
 * Application Constants file
 */

const busApiMeta = {
  originator: 'submission-api',
  mimeType: 'application/json',
  fileType: 'zip',
  events: {
    submission: {
      create: 'submission.notification.create',
      update: 'submission.notification.update',
      delete: 'submission.notification.delete'
    }
  }
}

const submissionIndex = 'submissionId-index'

module.exports = {
  busApiMeta,
  submissionIndex
}
