/**
 * The application entry point for mock API
 */

const express = require('express')
const cors = require('cors')
const winston = require('winston')
const config = require('config')

const app = express()
app.set('port', config.PORT)

app.use(cors())

// post bus event
app.post('/v5/bus/events', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.body, null, 2)}`)
  res.status(204).send()
})

// post bus event
app.post('/v5', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.body, null, 2)}`)
  res.status(204).send()
})

// get challenge
app.get('/v5/challenges/:challengeId', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.params, null, 2)}`)
  const result = {
    id: req.params.challengeId,
    legacyId: '30058874',
    phases: [
      {
        name: 'Submission',
        phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
        isOpen: true
      },
      {
        name: 'Appeals Response',
        phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
        actualEndDate: '01.01.2021',
        isOpen: false
      }
    ],
    legacy: {
      subTrack: 'Challenge'
    }
  }
  res.json(result)
})

// search challenges
app.get('/v5/challenges', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.query, null, 2)}`)
  const result = [{
    id: 'f01686da-28ab-48bc-867c-60faeae324da',
    legacyId: '30058874',
    phases: [
      {
        name: 'Submission',
        phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
        isOpen: true
      }
    ]
  }]
  res.json(result)
})
// search resources
app.get('/v5/resources', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.query, null, 2)}`)
  let result = []
  if (req.query.challengeId === 'f01686da-28ab-48bc-867c-60faeae324da') {
    result = [{
      memberId: '88774634',
      memberHandle: 'isbilir',
      roleId: '732339e7-8e30-49d7-9198-cccf9451e221'
    },
    {
      memberId: '40158994',
      memberHandle: 'TCConnCopilot',
      roleId: '732339e7-8e30-49d7-9198-cccf9451e221'
    },
    {
      memberId: '40158994',
      memberHandle: 'TCConnCopilot',
      roleId: 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd'
    },
    {
      memberId: '40029484',
      memberHandle: 'jcori',
      roleId: '732339e7-8e30-49d7-9198-cccf9451e221'
    }]
  }

  res.json(result)
})
// get resource roles
app.get('/v5/resource-roles', (req, res) => {
  winston.debug(`query: ${JSON.stringify(req.query, null, 2)}`)
  const result = [{'id': '732339e7-8e30-49d7-9198-cccf9451e221', 'name': 'Submitter', 'legacyId': 1, 'fullReadAccess': false, 'fullWriteAccess': false, 'isActive': true, 'selfObtainable': true},
    {'id': 'cfe12b3f-2a24-4639-9d8b-ec86726f76bd', 'name': 'Copilot', 'legacyId': 14, 'fullReadAccess': true, 'fullWriteAccess': true, 'isActive': true, 'selfObtainable': false}]
  res.json(result)
})

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' })
})

app.use((err, req, res, next) => {
  winston.error(err)
  res.status(500).json({
    error: err.message
  })
})

app.listen(app.get('port'), '0.0.0.0', () => {
  winston.info(`Express server listening on port ${app.get('port')}`)
})
