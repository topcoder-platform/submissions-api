/*
 * Setting up ES for tests
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test'

const prepare = require('mocha-prepare')
const { deleteDatafromES } = require('../../scripts/ESloadHelper')

prepare(function (done) {
  deleteDatafromES().then((data) => {
    done()
  })
})
