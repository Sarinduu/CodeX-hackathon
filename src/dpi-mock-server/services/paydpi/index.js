require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuid } = require('uuid');
const { load, save } = require('../../shared/store');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet());
app.use(morgan('dev'));

/* ───────────── Config ───────────── */
const PORT = process.env.PAYDPI_PORT || 4003;
const JWT_SECRET = process.env.SLUDI_JWT_SECRET || 'dev-super-secret';
const DEFAULT_CURRENCY = process.env.PAYDPI_DEFAULT_CURRENCY || 'LKR';

/* ───────────── Store helpers ───────────── */
function pdb() { return load('payments'); } // { payments: {} }
function commit(d) { save('payments', d); }

/* ───────────── Auth ───────────── */
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid/expired token' });
  }
}

/* ───────────── Utility ───────────── */
function nowMs() { return Date.now(); }
function toAmountCents(amount) {
  if (typeof amount === 'number') return Math.round(amount * 100);
  return Math.round(parseFloat(amount) * 100);
}

/* ───────────── Routes ───────────── */

/** Health */
app.get('/health', (_req, res) => res.json({ ok: true, service: 'PayDPI', time: nowMs() }));

/** Create payment intent */
app.post('/payments/intents', verifyToken, (req, res) => {
  const { amount, currency = DEFAULT_CURRENCY, reference, payerNic } = req.body || {};
  if (!amount || !payerNic) return res.status(400).json({ error: 'amount and payerNic required' });

  const d = pdb();
  const id = uuid();
  const intent = {
    id,
    kind: 'intent',
    status: 'REQUIRES_CONFIRMATION',
    amount: toAmountCents(amount),
    currency,
    reference: reference || `REF-${nowMs()}`,
    payerNic,
    createdAt: nowMs(),
    expiresAt: nowMs() + 1800 * 1000, // 30 mins expiry
    history: [{ at: nowMs(), action: 'CREATED' }]
  };
  d.payments[id] = intent;
  commit(d);

  const resp = {
    paymentId: id,
    status: intent.status,
    reference: intent.reference,
    expiresAt: intent.expiresAt
  };
  return res.json(resp);
});

/** Confirm payment */
app.post('/payments/confirm', verifyToken, (req, res) => {
  const { paymentId, result = 'SUCCESS' } = req.body || {};
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });

  const d = pdb();
  const p = d.payments?.[paymentId];
  if (!p) return res.status(404).json({ error: 'payment not found' });

  if (p.status === 'SUCCEEDED' || p.status === 'FAILED') {
    return res.json({ paymentId: p.id, status: p.status });
  }

  // Check if expired
  if (p.expiresAt && nowMs() > p.expiresAt) {
    p.status = 'CANCELED';
    p.history.push({ at: nowMs(), action: 'EXPIRED' });
    commit(d);
    return res.json({ paymentId: p.id, status: p.status, reason: 'expired' });
  }

  p.status = result === 'SUCCESS' ? 'SUCCEEDED' : 'FAILED';
  p.history.push({ at: nowMs(), action: 'CONFIRMED', result });
  commit(d);

  const resp = { paymentId: p.id, status: p.status, reference: p.reference };
  return res.json(resp);
});

/** Get a payment by ID */
app.get('/payments/:id', verifyToken, (req, res) => {
  const d = pdb();
  const p = d.payments?.[req.params.id];
  if (!p) return res.status(404).json({ error: 'payment not found' });
  return res.json(p);
});

/** List payments (by reference or payerNic) */
app.get('/payments', verifyToken, (req, res) => {
  const { reference, payerNic, status } = req.query;
  const d = pdb();
  let list = Object.values(d.payments || {});

  if (reference) list = list.filter(p => p.reference === reference);
  if (payerNic) list = list.filter(p => p.payerNic === payerNic);
  if (status) list = list.filter(p => p.status === status);

  return res.json({ count: list.length, items: list });
});

/* ───────────── Start ───────────── */
app.listen(PORT, () => console.log(`PayDPI running on :${PORT}`));
