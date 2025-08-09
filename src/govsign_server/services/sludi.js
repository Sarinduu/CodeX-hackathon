'use strict'
const axios = require('axios').default
const { SLUDI_BASE_URL, SLUDI_INTROSPECT_PATH, SLUDI_CLIENT_ID, SLUDI_CLIENT_SECRET } = require('../config')

async function introspect(token) {
  const url = new URL(SLUDI_INTROSPECT_PATH, SLUDI_BASE_URL).toString()
  const auth = Buffer.from(`${SLUDI_CLIENT_ID}:${SLUDI_CLIENT_SECRET}`).toString('base64')
  const params = new URLSearchParams({ token })
  const resp = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` },
    timeout: 10000,
  })
  return resp.data 
}

module.exports = { introspect }