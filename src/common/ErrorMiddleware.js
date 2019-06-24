/**
 * Common error handling middleware
 */

const errors = require('common-errors')
const config = require('config')
const httpStatus = require('http-status')

/**
 * The error middleware function
 *
 * @param  {Object}     err       the error that is thrown in the application
 * @param  {Object}     req       the express request instance
 * @param  {Object}     res       the express response instance
 * @param  {Function}   next      the next middleware in the chain
 */
function middleware (err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode
  let message
  if (err.isJoi || err.errors) {
    statusCode = httpStatus.BAD_REQUEST
    message = err.isJoi ? err.details[0].message : err.errors
  } else {
    const httpError = new errors.HttpStatusError(err)
    if (err.statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
      // unknown server error
      req.span.setTag('error', true)
      httpError.message = err.message || config.DEFAULT_MESSAGE
    }
    statusCode = httpError.statusCode
    message = httpError.message || config.DEFAULT_MESSAGE
  }

  req.span.setTag('statusCode', statusCode)
  // log response
  req.span.log({
    event: 'info',
    responseBody: { message }
  })

  if (err.statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
    // log unknown server error
    req.span.log({
      event: 'error',
      message: err.message,
      stack: err.stack,
      'error.object': err
    })
  }

  req.span.finish()

  res.status(statusCode).json({ message })
}

module.exports = () => middleware
