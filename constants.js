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

module.exports = {
  busApiMeta
}
