'use strict'
const { Router } = require('express')
const { body, param } = require('express-validator')
const { assertValid } = require('../middleware/validate')
const { requireAuth } = require('../middleware/auth')
const PayDPI = require('../services/paydpi')
const problem = require('../utils/problem')

const router = Router()

// Initiate payment
router.post(
  '/:processId/initiate',
  requireAuth,
  param('processId').isString().notEmpty(),
  body('amount').isNumeric().toFloat(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('description').optional().isString(),
  assertValid,
  async (req, res) => {
    try {
      const { amount, currency = 'LKR', description = 'GovSign Payment' } = req.body
      const payment = await PayDPI.createPayment({
        processId: req.params.processId,
        amount,
        currency,
        description,
      })
      return res.status(201).json(payment)
    } catch (err) {
      console.error('payment init error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to initiate payment with PayDPI')
    }
  }
)

// Poll payment status
router.get(
  '/status/:paymentId',
  requireAuth,
  param('paymentId').isString().notEmpty(),
  assertValid,
  async (req, res) => {
    try {
      const data = await PayDPI.getPayment(req.params.paymentId)
      return res.json(data)
    } catch (err) {
      console.error('payment status error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to fetch payment from PayDPI')
    }
  }
)

module.exports = router