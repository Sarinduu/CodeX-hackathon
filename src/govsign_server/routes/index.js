'use strict'
const { Router } = require('express')
const auth = require('./auth')
const workflows = require('./workflows')
const documents = require('./documents')
const payments = require('./payments')
const webhooks = require('./webhooks')

const router = Router()

router.use('/auth', auth)
router.use('/workflows', workflows)
router.use('/workflows', documents) // mounts /:id/documents
router.use('/payments', payments)
router.use('/webhooks', webhooks)

module.exports = router