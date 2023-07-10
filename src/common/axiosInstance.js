const axios = require('axios').default
const { getM2Mtoken } = require('./m2mHelper')
const logger = require('./logger')

const axiosInstance = axios.create({
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getM2Mtoken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use((response) => response, (error) => {
  if (error.response) {
    logger.error(error.response.data)
    logger.error(error.response.status)
    logger.error(error.response.headers)
  } else if (error.request) {
    logger.error(error.request)
  } else {
    logger.error('Error', error.message)
  }
})

module.exports = {
  axiosInstance
}
