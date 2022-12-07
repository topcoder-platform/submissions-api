/**
 * The application entry point
 */

require('./src/bootstrap')
const config = require('config')
const express = require('express')
const errors = require('common-errors')
const cors = require('cors')
const bodyParser = require('body-parser')
const httpStatus = require('http-status')
const _ = require('lodash')
const winston = require('winston')
const helper = require('./src/common/helper')
const errorMiddleware = require('./src/common/ErrorMiddleware')
const routes = require('./src/routes')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const authenticator = require('tc-core-library-js').middleware.jwtAuthenticator
const fileUpload = require('express-fileupload')

const swaggerDocument = YAML.load('./docs/swagger.yaml')
const app = express()
const http = require('http').Server(app)

app.set('port', config.WEB_SERVER_PORT)

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())
app.use(fileUpload())

const apiRouter = express.Router()

/**
 *
 * @param {Array} source the array in which to search for the term
 * @param {Array | String} term the term to search
 */
function checkIfExists(source, term) {
  let terms

  if (!_.isArray(source)) {
    throw new Error('Source argument should be an array')
  }

  source = source.map(s => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.split(' ')
  } else if (_.isArray(term)) {
    terms = term.map(t => t.toLowerCase())
  } else {
    throw new Error('Term argument should be either a string or an array')
  }

  for (let i = 0; i < terms.length; i++) {
    if (source.includes(terms[i])) {
      return true
    }
  }

  return false
}

/* eslint-disable no-param-reassign */
_.each(routes, (verbs, url) => {
  _.each(verbs, (def, verb) => {
    let actions = [
      (req, res, next) => {
        req.signature = `${def.controller}#${def.method}`
        next()
      }
    ]
    const method = require(`./src/controllers/${def.controller}`)[def.method]; // eslint-disable-line

    if (!method) {
      throw new Error(`${def.method} is undefined, for controller ${def.controller}`)
    }
    if (def.middleware && def.middleware.length > 0) {
      actions = actions.concat(def.middleware)
    }

    // add Authenticator check if route has auth
    if (def.auth) {
      actions.push((req, res, next) => {
        authenticator(_.pick(config, ['AUTH_SECRET', 'VALID_ISSUERS']))(req, res, next)
      })

      actions.push((req, res, next) => {
        if (!req.authUser) {
          next(new errors.HttpStatusError(401, 'Authentication required!'))
        }

        if (req.authUser.roles) {
          if (!checkIfExists(def.access, req.authUser.roles)) {
            next(new errors.HttpStatusError(403, 'You are not allowed to perform this action!'))
          } else {
            next()
          }
        } else if (req.authUser.scopes) {
          if (!checkIfExists(def.scopes, req.authUser.scopes)) {
            next(new errors.HttpStatusError(403, 'You are not allowed to perform this action!'))
          } else {
            next()
          }
        } else if ((_.isArray(def.access) && def.access.length > 0) ||
          (_.isArray(def.scopes) && def.scopes.length > 0)) {
          next(new errors.HttpStatusError(401, 'You are not authorized to perform this action'))
        } else {
          next()
        }
      })
    }

    if (def.blockByIp) {
      actions.push((req, res, next) => {
        req.authUser.blockIP = _.find(req.authUser, (value, key) => {
          return (key.indexOf('blockIP') !== -1)
        })
        if (req.authUser.blockIP) {
          throw new errors.HttpStatusError(403, 'Access denied')
        } else {
          next()
        }
      })
    }

    actions.push(method)
    winston.info(`API : ${verb.toLocaleUpperCase()} ${config.API_VERSION}${url}`)
    apiRouter[verb](`${config.API_VERSION}${url}`, helper.autoWrapExpress(actions))
  })
})
/* eslint-enable no-param-reassign */

app.use('/v5/submissions/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/', apiRouter)
app.use(errorMiddleware())
// Serve Swagger Docs after setting host and base path
swaggerDocument.host = config.HOST
swaggerDocument.basePath = config.API_VERSION

// Check if the route is not found or HTTP method is not supported
app.use('*', (req, res) => {
  const pathKey = req.baseUrl.substring(config.API_VERSION.length)
  const route = routes[pathKey]
  if (route) {
    res.status(httpStatus.METHOD_NOT_ALLOWED).json({ message: 'The requested HTTP method is not supported.' })
  } else {
    res.status(httpStatus.NOT_FOUND).json({ message: 'The requested resource cannot be found.' })
  }
})

http.listen(app.get('port'), () => {
  winston.info(`Express server listening on port ${app.get('port')}`)
})

module.exports = app
