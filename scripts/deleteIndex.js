/**
 * Delete index in Opensearch
 */

const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

async function deleteIndex () {
  logger.info('OS Index deletion started!')
  const osClient = helper.getOsClient()
  await osClient.indices.delete({
    index: config.get('osConfig.OS_INDEX')
  })
  logger.info('OS Index deletion succeeded!')
  process.exit(0)
}

deleteIndex().catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
