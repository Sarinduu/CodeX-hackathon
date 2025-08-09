require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { load, save } = require('../../shared/store');

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan('dev'));

const PORT = process.env.NDX_PORT || 4002;
const JWT_SECRET = process.env.SLUDI_JWT_SECRET || 'dev-super-secret';

const UPLOAD_DIR = path.join(__dirname, '../../shared/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

/* ──────────────────────────────────────────────
 * DB helpers (JSON-backed)
 * ────────────────────────────────────────────── */
function usersDb() { return load('users'); }          // { users: { [nic]: Citizen } }
function usersCommit(d) { save('users', d); }

function officersDb() { return load('officers'); }    // { officers: { [nic]: Officer } }
function officersCommit(d) { save('officers', d); }

function officesDb() { return load('offices'); }      // { offices: { [id]: Office } }
function officesCommit(d) { save('offices', d); }

function filesDb() { return load('files'); }          // { files: { [id]: FileMeta } }
function filesCommit(d) { save('files', d); }

function docsDb() { return load('documents'); }       // { docs: { [docId]: ProcessDoc } }
function docsCommit(d) { save('documents', d); }

/* Ensure shapes exist */
(function ensureShapes() {
  const u = usersDb(); u.users ||= {}; usersCommit(u);
  const of = officersDb(); of.officers ||= {}; officersCommit(of);
  const os = officesDb(); os.offices ||= {}; officesCommit(os);
  const f = filesDb(); f.files ||= {}; filesCommit(f);
  const d = docsDb(); d.docs ||= {}; docsCommit(d);
})();

/* ──────────────────────────────────────────────
 * Auth middleware
 * ────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
 * Citizens, Officers, and Signatures
 * ────────────────────────────────────────────── */

/** Get citizen details */
app.get('/citizens/:nic', verifyToken, (req, res) => {
  const udb = usersDb();
  const citizen = udb.users?.[req.params.nic];
  if (!citizen) return res.status(404).json({ error: 'not found' });
  res.json(citizen);
});

/** Get officer details */
app.get('/officers/:nic', verifyToken, (req, res) => {
  const odb = officersDb();
  const officer = odb.officers?.[req.params.nic];
  if (!officer) return res.status(404).json({ error: 'not found' });
  res.json(officer);
});

/** Get citizen under an officer's jurisdiction */
app.get('/officers/:nic/citizens', verifyToken, (req, res) => {
  if (req.user.actor !== 'OFFICER') return res.status(403).json({ error: 'forbidden' });
  const udb = usersDb();
  const all = Object.values(udb.users || {});
  const filtered = all.filter(c => c.officerId === req.params.nic); // officerId should link the officer to the citizen
  res.json({ count: filtered.length, citizens: filtered });
});

/** Add officer signature */
app.post('/officers/:nic/signature', verifyToken, upload.single('file'), (req, res) => {
  if (req.user.actor !== 'OFFICER' || req.params.nic !== req.user.sub) return res.status(403).json({ error: 'forbidden' });

  if (!req.file) return res.status(400).json({ error: 'file required' });

  const id = uuid();
  const record = {
    id,
    filename: req.file.filename,
    path: req.file.path,
    mime: req.file.mimetype,
    size: req.file.size,
    createdAt: Date.now(),
    uploadedBy: req.user.sub
  };

  const f = filesDb();
  f.files[id] = record;
  filesCommit(f);

  const odb = officersDb();
  const officer = odb.officers?.[req.params.nic];
  if (!officer) return res.status(404).json({ error: 'officer not found' });

  officer.signatureFileId = id;
  officersCommit(odb);

  res.json({ ok: true, officerNic: req.params.nic, signatureFileId: id, url: `/files/${id}` });
});

/** Get officer signature */
app.get('/officers/:nic/signature', verifyToken, (req, res) => {
  const odb = officersDb();
  const officer = odb.officers?.[req.params.nic];
  if (!officer) return res.status(404).json({ error: 'officer not found' });
  if (!officer.signatureFileId) return res.status(404).json({ error: 'no signature' });

  const f = filesDb();
  const meta = f.files?.[officer.signatureFileId];
  if (!meta) return res.status(404).json({ error: 'signature file missing' });

  res.json({ signatureFileId: officer.signatureFileId, url: `/files/${officer.signatureFileId}`, meta });
});

/* ──────────────────────────────────────────────
 * PDF Handling and Versioning
 * ────────────────────────────────────────────── */

/** Create or add a new version of a process document */
app.post('/process-docs', verifyToken, upload.single('file'), (req, res) => {
  const { citizenNic, processType, referenceNo, note } = req.body || {};
  if (!citizenNic || !processType || !req.file) return res.status(400).json({ error: 'citizenNic, processType, file required' });

  const udb = usersDb();
  const citizen = udb.users?.[citizenNic];
  if (!citizen) return res.status(404).json({ error: 'citizen not found' });
  if (req.user.actor === 'CITIZEN' && req.user.sub !== citizenNic) return res.status(403).json({ error: 'forbidden' });

  const f = filesDb();
  const id = uuid();
  const fileRecord = {
    id,
    filename: req.file.filename,
    path: req.file.path,
    mime: req.file.mimetype,
    size: req.file.size,
    createdAt: Date.now(),
    uploadedBy: req.user.sub
  };
  f.files[id] = fileRecord;
  filesCommit(f);

  const ddb = docsDb();
  const docId = uuid();
  const doc = {
    id: docId,
    citizenNic,
    processType,
    referenceNo: referenceNo || null,
    createdAt: Date.now(),
    createdBy: req.user.sub,
    versions: [
      { v: 1, fileId: id, note: note || 'initial version', ts: Date.now(), updatedBy: req.user.sub }
    ]
  };
  ddb.docs[docId] = doc;
  docsCommit(ddb);

  res.json(doc);
});

/** Add a new version to an existing process document */
app.put('/process-docs/:docId/versions', verifyToken, upload.single('file'), (req, res) => {
  const { fileId, note } = req.body || {};
  if (!fileId || !req.file) return res.status(400).json({ error: 'fileId and file required' });

  const ddb = docsDb();
  const doc = ddb.docs?.[req.params.docId];
  if (!doc) return res.status(404).json({ error: 'document not found' });

  const f = filesDb();
  const newFileId = uuid();
  const fileRecord = {
    id: newFileId,
    filename: req.file.filename,
    path: req.file.path,
    mime: req.file.mimetype,
    size: req.file.size,
    createdAt: Date.now(),
    uploadedBy: req.user.sub
  };
  f.files[newFileId] = fileRecord;
  filesCommit(f);

  const version = {
    v: doc.versions.length + 1,
    fileId: newFileId,
    note: note || `Version ${doc.versions.length + 1}`,
    ts: Date.now(),
    updatedBy: req.user.sub
  };
  doc.versions.push(version);
  docsCommit(ddb);

  res.json({ ok: true, docId: doc.id, newVersion: version });
});

/** Get full document metadata + versions */
app.get('/process-docs/:docId', verifyToken, (req, res) => {
  const ddb = docsDb();
  const doc = ddb.docs?.[req.params.docId];
  if (!doc) return res.status(404).json({ error: 'document not found' });
  res.json(doc);
});

/** Get the latest version of a process document (including file URL) */
app.get('/process-docs/:docId/latest', verifyToken, (req, res) => {
  const ddb = docsDb();
  const doc = ddb.docs?.[req.params.docId];
  if (!doc) return res.status(404).json({ error: 'document not found' });

  const latest = doc.versions[doc.versions.length - 1];
  const f = filesDb();
  const meta = f.files?.[latest.fileId];
  res.json({ docId: doc.id, version: latest, file: meta, url: `/files/${latest.fileId}` });
});

/** List all documents for a citizen */
app.get('/citizens/:nic/process-docs', verifyToken, (req, res) => {
  const udb = usersDb();
  const citizen = udb.users?.[req.params.nic];
  if (!citizen) return res.status(404).json({ error: 'citizen not found' });
  if (req.user.actor === 'CITIZEN' && req.user.sub !== req.params.nic) return res.status(403).json({ error: 'forbidden' });

  const ddb = docsDb();
  const all = Object.values(ddb.docs || {}).filter(d => d.citizenNic === req.params.nic);
  res.json({ count: all.length, docs: all });
});

app.listen(PORT, () => console.log(`NDX running on :${PORT}`));
