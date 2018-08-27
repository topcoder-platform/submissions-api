/**
 * Initialize application and load routes
 */

global.Promise = require('bluebird')
const config = require('config')
const fs = require('fs')
const joi = require('joi')
const path = require('path')
const logger = require('./common/logger')

joi.id = () => joi.number().integer().min(1)
joi.score = () => joi.number().min(0).max(100)
joi.pageSize = () => joi.number().integer().min(1).max(config.get('MAX_PAGE_SIZE'))

function buildServices (dir) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const curPath = path.join(dir, file)
    fs.stat(curPath, (err, stats) => {
      if (err) return
      if (stats.isDirectory()) {
        buildServices(curPath)
      } else if (path.extname(file) === '.js') {
        logger.buildService(require(curPath)); // eslint-disable-line
      }
    })
  })
}

buildServices(path.join(__dirname, 'services'))
