'use strict'
const { Router } = require('express')
const multer = require('multer')
const axios = require('axios').default
const { param } = require('express-validator')
const { assertValid } = require('../middleware/validate')
const { requireAuth } = require('../middleware/auth')
const NDX = require('../services/ndx')
const problem = require('../utils/problem')
const { NDX_BASE_URL, NDX_API_KEY } = require('../config')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
const router = Router()

// Upload to NDX via presigned URL
router.post(
  '/:id/documents',
  requireAuth,
  param('id').isString().notEmpty(),
  upload.single('file'),
  assertValid,
  async (req, res) => {
    try {
      if (!req.file) return problem(res, 400, 'ValidationError', 'Missing file upload')
      const filename = req.file.originalname
      const mime = req.file.mimetype

      const { uploadUrl, documentId } = await NDX.getUploadUrl(req.params.id, filename, mime)
      await axios.put(uploadUrl, req.file.buffer, { headers: { 'Content-Type': mime } })
      await NDX.markDocumentAttached(req.params.id, documentId)

      return res.status(201).json({ documentId })
    } catch (err) {
      console.error('upload error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to upload document to NDX')
    }
  }
)

// Optional proxy download
router.get(
  '/documents/:docId/download',
  requireAuth,
  param('docId').isString().notEmpty(),
  assertValid,
  async (req, res) => {
    try {
      const url = `${NDX_BASE_URL}/documents/${req.params.docId}/download`
      const resp = await axios.get(url, { responseType: 'stream', headers: { 'x-api-key': NDX_API_KEY } })
      res.setHeader('Content-Type', resp.headers['content-type'] || 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.docId}.pdf"`)
      resp.data.pipe(res)
    } catch (err) {
      console.error('download error:', err?.response?.data || err.message)
      return problem(res, 502, 'UpstreamError', 'Failed to download from NDX')
    }
  }
)

module.exports = router