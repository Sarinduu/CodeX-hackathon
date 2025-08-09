const { httpPayDPI } = require('./http')

async function createPayment({ processId, amount, currency = 'LKR', description }) {
  const resp = await httpPayDPI.post('/payments', { processId, amount, currency, description })
  return resp.data // { paymentId, checkoutUrl, status }
}

async function getPayment(paymentId) {
  const resp = await httpPayDPI.get(`/payments/${paymentId}`)
  return resp.data // { paymentId, status, receiptUrl }
}

module.exports = { createPayment, getPayment }