/**
 * This module contains the winston logger configuration.
 */

const _ = require('lodash')
const Joi = require('joi')
const { createLogger, format, transports } = require('winston')
const util = require('util')
const config = require('config')
const getParams = require('get-parameter-names')

const logger = createLogger({
  level: config.LOG_LEVEL,
  transports: [
    new transports.Console({
      format: format.printf((info) => `${info.level}: ${info.message}`)
    })
  ]
})

/**
 * Log error details with signature
 * @param err the error
 * @param signature the signature
 */
logger.logFullError = (err, signature) => {
  if (!err) {
    return
  }
  if (signature) {
    logger.error(`Error happened in ${signature}`)
  }
  logger.error(util.inspect(err))
  if (!err.logged) {
    logger.error(err.stack)
    err.logged = true
  }
}

/**
 * Convert array with arguments to object
 * @param {Array} params the name of parameters
 * @param {Array} arr the array with values
 * @private
 */
function _combineObject (params, arr) {
  const ret = {}
  _.each(arr, (arg, i) => {
    ret[params[i]] = arg
  })
  return ret
}

/**
 * Decorate all functions of a service and log debug information if DEBUG is enabled
 * @param {Object} service the service
 */
logger.decorateWithLogging = (service) => {
  if (config.LOG_LEVEL !== 'debug') {
    return
  }
  _.each(service, (method, name) => {
    const params = method.params || getParams(method)
    service[name] = async function () {
      const shouldLog = name !== 'check'
      if (shouldLog) {
        logger.debug(`ENTER ${name}`)
        logger.debug('input arguments')
        const args = Array.prototype.slice.call(arguments)
        logger.debug(util.inspect(_combineObject(params, args), { breakLength: Infinity, maxArrayLength: 5 }))
      }
      try {
        const result = await method.apply(this, arguments)
        if (shouldLog) {
          logger.debug(`EXIT ${name}`)
          logger.debug('output arguments')
          if (result !== null && result !== undefined) {
            logger.debug(util.inspect(result, { breakLength: Infinity, maxArrayLength: 5 }))
          }
        }
        return result
      } catch (e) {
        logger.logFullError(e, name)
        throw e
      }
    }
  })
}

/**
 * Decorate all functions of a service and validate input values
 * and replace input arguments with sanitized result form Joi
 * Service method must have a `schema` property with Joi schema
 * @param {Object} service the service
 */
logger.decorateWithValidators = function (service) {
  _.each(service, (method, name) => {
    if (!method.schema) {
      return
    }
    const params = getParams(method)
    service[name] = async function () {
      const args = Array.prototype.slice.call(arguments)
      const value = _combineObject(params, args)
      const normalized = Joi.attempt(value, method.schema)

      const newArgs = []
      // Joi will normalize values
      // for example string number '1' to 1
      // if schema type is number
      _.each(params, (param) => {
        newArgs.push(normalized[param])
      })
      return method.apply(this, newArgs)
    }
    service[name].params = params
  })
}

/**
 * Apply logger and validation decorators
 * @param {Object} service the service to wrap
 */
logger.buildService = function (service) {
  logger.decorateWithValidators(service)
  logger.decorateWithLogging(service)
}

module.exports = logger
