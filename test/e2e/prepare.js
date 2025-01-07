/*
 * Setting up OS for tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const prepare = require('mocha-prepare')
const { deleteDatafromOS } = require('../../scripts/ESloadHelper')

prepare(function (done) {
  deleteDatafromOS().then((data) => {
    done()
  })
})
