'use strict'
const axios = require('axios').default
const { NDX_BASE_URL, NDX_API_KEY, PAYDPI_BASE_URL, PAYDPI_API_KEY } = require('../config')

const httpNDX = axios.create({ baseURL: NDX_BASE_URL, timeout: 15000, headers: { 'x-api-key': NDX_API_KEY } })
const httpPayDPI = axios.create({ baseURL: PAYDPI_BASE_URL, timeout: 15000, headers: { 'x-api-key': PAYDPI_API_KEY } })

module.exports = { httpNDX, httpPayDPI }