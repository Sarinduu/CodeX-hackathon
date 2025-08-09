require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { load, save } = require("../../shared/store");

const app = express();

const PORT = process.env.SLUDI_PORT || 4001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const JWT_SECRET = process.env.SLUDI_JWT_SECRET || "dev-super-secret";
const TOKEN_TTL = parseInt(process.env.SLUDI_TOKEN_TTL || "9000", 10);
const ADMIN_ENABLED = process.env.SLUDI_DEV_ADMIN === "true";
const OFFICER_TYPES = ["GN", "DIVSEC", "DISTSEC", "PROVINCIAL", "MINISTRY"];

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

function db() {
  return load("sludi");
}
function commit(d) {
  save("sludi", d);
}
(function ensureShape() {
  const d = db();
  d.sessions ||= {};
  d.registry ||= {}; // { [nic]: { actor, officerType?, officeId?, jurisdiction:{...} } }
  d.offices ||= {}; // { [officeId]: {...} }
  commit(d);
})();

function validNIC(nic) {
  return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
}

function signJwt(claims) {
  return jwt.sign(claims, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid/expired token" });
  }
}

function scopesFor(identity) {
  if (identity.actor === "CITIZEN")
    return ["citizen:read:self", "citizen:write:self"];
  switch (identity.officerType) {
    case "GN":
      return [
        "citizen:read:villages",
        "citizen:write:villages",
        "process:approve:villages",
        "process:sign",
      ];
    case "DIVSEC":
      return [
        "citizen:read:divisions",
        "citizen:write:divisions",
        "process:approve:divisions",
      ];
    case "DISTSEC":
      return [
        "citizen:read:districts",
        "citizen:write:districts",
        "process:approve:districts",
        "audit:view:districts",
      ];
    case "PROVINCIAL":
      return [
        "citizen:read:provinces",
        "citizen:write:provinces",
        "process:approve:provinces",
        "audit:view:provinces",
      ];
    case "MINISTRY":
      return [
        "citizen:read:country",
        "process:approve:country",
        "audit:view:country",
      ];
    default:
      return [];
  }
}

/* Step 1: Validate NIC -> session + challenge + role hints */
app.post("/auth/validate-nic", (req, res) => {
  const { nic } = req.body || {};
  if (!nic) return res.status(400).json({ error: "Provide NIC" });
  if (!validNIC(nic))
    return res.status(422).json({ error: "Invalid NIC format" });

  const d = db();
  const identity = d.registry[nic] || { actor: "CITIZEN" };

  const sessionId = uuid();
  d.sessions[sessionId] = {
    nic,
    type: "NIC",
    status: "NIC_VALIDATED",
    challenge: uuid().slice(0, 6),
    identity,
  };
  commit(d);

  res.json({
    sessionId,
    status: "NIC_VALIDATED",
    challenge: d.sessions[sessionId].challenge,
    roleHint: identity.actor,
    hasPassword: identity.password ? true : false, // Add password status for citizens
    officerTypeHint:
      identity.actor === "OFFICER" ? identity.officerType : undefined,
  });
});

/* Step 2: Authenticate Officer */
app.post("/auth/verify-fingerprint", (req, res) => {
  const { sessionId, fingerprintCode, challenge } = req.body || {};
  if (!sessionId || !fingerprintCode)
    return res
      .status(400)
      .json({ error: "sessionId and fingerprintCode required" });

  const d = db();
  const s = d.sessions[sessionId];
  if (!s) return res.status(404).json({ error: "session not found" });
  if (challenge && challenge !== s.challenge)
    return res.status(401).json({ error: "challenge mismatch" });

  const identity = s.identity;

  // Officer fingerprint verification
  if (identity.actor === "OFFICER") {
    // Simulate fingerprint verification
    s.status = "AUTHENTICATED";
    const token = signJwt({
      sub: s.nic,
      actor: identity.actor,
      officerType: identity.officerType,
      scopes: scopesFor(identity),
    });
    s.accessToken = token;
    commit(d);
    return res.json({ status: "AUTHENTICATED", accessToken: token });
  }

  return res
    .status(401)
    .json({ error: "Only officers can verify fingerprint" });
});

/* Step 3: Citizen login with password */
app.post("/auth/verify-password", (req, res) => {
  const { sessionId, password } = req.body || {};
  if (!sessionId || !password)
    return res.status(400).json({ error: "sessionId and password required" });

  const d = db();
  const s = d.sessions[sessionId];
  if (!s) return res.status(404).json({ error: "session not found" });

  const identity = s.identity;

  // Citizen password authentication
  if (identity.actor === "CITIZEN" && identity.password === password) {
    s.status = "AUTHENTICATED";
    const token = signJwt({
      sub: s.nic,
      actor: identity.actor,
      scopes: scopesFor(identity),
    });
    s.accessToken = token;
    commit(d);
    return res.json({ status: "AUTHENTICATED", accessToken: token });
  }

  return res.status(401).json({ error: "Invalid password for citizen" });
});

/* Step 4: Citizen account creation (password) */
app.post("/auth/create-password", (req, res) => {
  const { sessionId, password } = req.body || {};
  if (!sessionId || !password)
    return res.status(400).json({ error: "sessionId and password required" });

  const d = db();
  const s = d.sessions[sessionId];
  if (!s) return res.status(404).json({ error: "session not found" });

  const identity = s.identity;

  // Only allow citizens to create passwords
  if (identity.actor === "CITIZEN" && !identity.password) {
    identity.password = password;
    s.status = "ACCOUNT_CREATED";
    const token = signJwt({
      sub: s.nic,
      actor: identity.actor,
      scopes: scopesFor(identity),
    });
    s.accessToken = token;
    commit(d);
    return res.json({ status: "ACCOUNT_CREATED", accessToken: token });
  }

  return res
    .status(403)
    .json({ error: "Citizen already has a password or invalid actor" });
});

/* Admin seeders (dev only) */
if (ADMIN_ENABLED) {
  app.post("/admin/registry/upsert", (req, res) => {
    const { nic, actor, officerType, officeId, jurisdiction, password } =
      req.body || {};
    if (!nic || !actor)
      return res.status(400).json({ error: "nic and actor required" });

    const entry = { actor: actor || "CITIZEN" };
    if (entry.actor === "OFFICER") {
      if (!officerType || !OFFICER_TYPES.includes(officerType)) {
        return res
          .status(400)
          .json({
            error: `officerType must be one of ${OFFICER_TYPES.join(", ")}`,
          });
      }
      entry.officerType = officerType;
      entry.officeId = officeId || null;
      const j = jurisdiction || {};
      entry.jurisdiction = {
        villages: j.villages || [],
        divisions: j.divisions || [],
        districts: j.districts || [],
        provinces: j.provinces || [],
        country: !!j.country,
      };
    }
    entry.password = password || null;
    const d = db();
    d.registry[nic] = entry;
    commit(d);
    res.json({ ok: true, entry });
  });
} else {
  app.post("/admin/registry/upsert", (_req, res) =>
    res
      .status(403)
      .json({ error: "admin endpoints disabled; set SLUDI_DEV_ADMIN=true" })
  );
}

app.listen(PORT, () => {
  console.log(`SLUDI running on :${PORT}`);
  console.log(`Admin seeders: ${ADMIN_ENABLED ? "ENABLED" : "DISABLED"}`);
});
