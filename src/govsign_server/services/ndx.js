'use strict'
const { httpNDX } = require('./http')

async function createProcess({ citizenId, serviceType, metadata }) {
  const resp = await httpNDX.post('/processes', { citizenId, serviceType, metadata })
  return resp.data
}

async function getProcess(processId) {
  const resp = await httpNDX.get(`/processes/${processId}`)
  return resp.data
}

async function getUploadUrl(processId, filename, mime) {
  const resp = await httpNDX.post(`/processes/${processId}/documents/presign`, { filename, mime })
  return resp.data // { uploadUrl, documentId }
}

async function markDocumentAttached(processId, documentId) {
  const resp = await httpNDX.post(`/processes/${processId}/documents/${documentId}/attach`)
  return resp.data
}

async function submitSignature(processId, action, note, actorId) {
  const resp = await httpNDX.post(`/processes/${processId}/signatures`, { action, note, actorId })
  return resp.data
}

module.exports = { createProcess, getProcess, getUploadUrl, markDocumentAttached, submitSignature }