'use strict'
const crypto = require('crypto')

function signHmacSha256(secret, payloadBuffer) {
  return crypto.createHmac('sha256', secret).update(payloadBuffer).digest('hex')
}

module.exports = { signHmacSha256 }