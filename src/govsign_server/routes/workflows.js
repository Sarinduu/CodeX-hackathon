'use strict'
const { Router } = require('express')
const { body, param } = require('express-validator')
const { assertValid } = require('../middleware/validate')
const { requireAuth, requireScope } = require('../middleware/auth')
const NDX = require('../services/ndx')
const problem = require('../utils/problem')

const router = Router()

// Initiate workflow
router.post(
  '/initiate',
  requireAuth,
  body('serviceType').isString().trim().notEmpty(),
  body('metadata').optional().isObject(),
  assertValid,
  async (req, res) => {
    try {
      const { serviceType, metadata = {} } = req.body
      const citizenId = req.user.id
      const process = await NDX.createProcess({ citizenId, serviceType, metadata })
      return res.status(201).json(process)
    } catch (err) {
      console.error('initiate error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to create process in NDX')
    }
  }
)

// Status
router.get(
  '/:id/status',
  requireAuth,
  param('id').isString().notEmpty(),
  assertValid,
  async (req, res) => {
    try {
      const data = await NDX.getProcess(req.params.id)
      return res.json(data)
    } catch (err) {
      console.error('status error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to fetch process from NDX')
    }
  }
)

// Officer sign
router.post(
  '/:id/sign',
  requireAuth,
  requireScope('sign:process'),
  param('id').isString().notEmpty(),
  body('action').isIn(['approve', 'reject']).withMessage('action must be approve|reject'),
  body('note').optional().isString(),
  assertValid,
  async (req, res) => {
    try {
      const { action, note } = req.body
      const actorId = req.user.id
      const result = await NDX.submitSignature(req.params.id, action, note, actorId)
      return res.json(result)
    } catch (err) {
      console.error('sign error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to submit signature to NDX')
    }
  }
)

module.exports = router