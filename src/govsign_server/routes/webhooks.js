'use strict'
const { Router } = require('express')
const problem = require('../utils/problem')
const { signHmacSha256 } = require('../utils/hmac')
const { WEBHOOK_SECRET_NDX, WEBHOOK_SECRET_PAYDPI } = require('../config')

const router = Router()

// Raw body for signature verification
router.use('/ndx', require('express').raw({ type: '*/*' }))
router.use('/paydpi', require('express').raw({ type: '*/*' }))

router.post('/ndx', (req, res) => {
  try {
    const sig = req.get('x-ndx-signature') || ''
    const expected = signHmacSha256(WEBHOOK_SECRET_NDX, req.body)
    if (sig !== expected) return problem(res, 401, 'Unauthorized', 'Invalid webhook signature')

    const evt = JSON.parse(req.body.toString('utf8'))
    console.log('[NDX webhook]', evt)
    return res.status(204).end()
  } catch (err) {
    console.error('ndx webhook error:', err.message)
    return problem(res, 400, 'BadRequest', 'Invalid NDX webhook payload')
  }
})

router.post('/paydpi', (req, res) => {
  try {
    const sig = req.get('x-paydpi-signature') || ''
    const expected = signHmacSha256(WEBHOOK_SECRET_PAYDPI, req.body)
    if (sig !== expected) return problem(res, 401, 'Unauthorized', 'Invalid webhook signature')

    const evt = JSON.parse(req.body.toString('utf8'))
    console.log('[PayDPI webhook]', evt)
    // Optionally: notify NDX payment confirmation here
    return res.status(204).end()
  } catch (err) {
    console.error('paydpi webhook error:', err.message)
    return problem(res, 400, 'BadRequest', 'Invalid PayDPI webhook payload')
  }
})

module.exports = router