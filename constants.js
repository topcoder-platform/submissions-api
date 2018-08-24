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

const MACHINE_USER = 'machine'

module.exports = {
  busApiMeta,
  MACHINE_USER
}
