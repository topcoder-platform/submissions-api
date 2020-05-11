/*
 * Setting up ES for tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const co = require('co')
const prepare = require('mocha-prepare')
const { deleteDatafromES, loadES } = require('../../scripts/ESloadHelper')

prepare(function (done) {
  co(function * () {
    yield loadES()
  }).then(() => {
    done()
  })
}, function (done) {
  // called after all test completes (regardless of errors)
  co(function * () {
    yield deleteDatafromES()
  }).then(() => {
    done()
  })
})
