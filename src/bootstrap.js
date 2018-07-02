/**
 * Initialize application and load routes
 */

global.Promise = require('bluebird')
const fs = require('fs')
const joi = require('joi')
const path = require('path')
const logger = require('./common/logger')

joi.id = () => joi.number().integer().min(1)

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
