
# SLUDI API Documentation – Secure Login & Unified Digital Identity

This service handles the authentication for **citizens** and **officers** using NIC and fingerprint verification.

---

## 📂 Base URL
```
http://localhost:4001
```

---

## **1. POST /auth/validate-nic**
Authenticate a user or officer by NIC or eNIC.

**Request**
```json
{
  "nic": "200012345678"
}
```

**Response**
```json
{
  "sessionId": "d0f6c1c0-...",
  "status": "NIC_VALIDATED",
  "challenge": "9a1c0b",
  "roleHint": "OFFICER",
  "officerTypeHint": "GN",
  "hasPassword": false  // Added: password status for citizens
}
```

**Status Codes**
- `200 OK` – NIC validated, awaiting fingerprint verification
- `400 Bad Request` – NIC or eNIC is missing in the request
- `422 Unprocessable Entity` – Invalid NIC format

---

## **2. POST /auth/verify-fingerprint**
Verify fingerprint after NIC entry. This step finalizes the login process by validating the fingerprint hash.

**Request**
```json
{
  "sessionId": "<sessionId_from_previous_step>",
  "deviceId": "kiosk-01",
  "fingerprintCode": "any-fingerprint-code",
  "challenge": "<challenge_from_previous_step>"
}
```

**Response**
```json
{
  "status": "AUTHENTICATED",
  "accessToken": "<JWT>",
  "expiresIn": 900,
  "claims": {
    "sub": "200012345678",
    "actor": "CITIZEN",
    "officerType": null,
    "officeId": null,
    "jurisdiction": { "villages": [], "divisions": [], "districts": [], "provinces": [], "country": false },
    "typ": "NIC",
    "scopes": ["citizen:read:self", "citizen:write:self"]
  }
}
```

**Status Codes**
- `200 OK` – Authentication successful, JWT returned
- `401 Unauthorized` – Fingerprint mismatch or challenge failure
- `404 Not Found` – Session ID not found

---

## **3. POST /auth/verify-password**
Verify the password for **citizens** with an existing password after NIC validation.

**Request**
```json
{
  "sessionId": "<sessionId_from_previous_step>",
  "password": "securepassword123"
}
```

**Response**
```json
{
  "status": "AUTHENTICATED",
  "accessToken": "<JWT>",
  "expiresIn": 900,
  "claims": {
    "sub": "200012345678",
    "actor": "CITIZEN",
    "scopes": ["citizen:read:self", "citizen:write:self"]
  }
}
```

**Status Codes**
- `200 OK` – Authentication successful
- `401 Unauthorized` – Invalid password
- `404 Not Found` – Session not found

---

## **4. POST /auth/create-password**
Create an account for a **citizen** who does not have a password. This endpoint also logs in the citizen immediately.

**Request**
```json
{
  "sessionId": "<sessionId_from_previous_step>",
  "password": "newsecurepassword"
}
```

**Response**
```json
{
  "status": "ACCOUNT_CREATED",
  "message": "Account created successfully.",
  "accessToken": "<JWT>",
  "expiresIn": 900
}
```

**Status Codes**
- `200 OK` – Citizen account created and logged in
- `400 Bad Request` – sessionId or password missing
- `403 Forbidden` – Citizen already has a password or invalid actor

---

## **5. Admin Endpoints (Optional, Dev Only)**

**These endpoints are only available if `SLUDI_DEV_ADMIN=true` is set in the environment.**

### **5.1 POST /admin/registry/upsert**
Admin endpoint to seed or modify citizen and officer records.

**Request**
```json
{
  "nic": "200012345678",
  "actor": "CITIZEN",
  "officerType": "GN",
  "officeId": "GN-001",
  "jurisdiction": { "villages": ["Udawela"], "divisions": [], "districts": [], "provinces": [], "country": false }
}
```

**Response**
```json
{
  "ok": true,
  "entry": {
    "actor": "CITIZEN",
    "officerType": "GN",
    "jurisdiction": { "villages": ["Udawela"], "divisions": [], "districts": [], "provinces": [], "country": false }
  }
}
```

**Status Codes**
- `200 OK` – Successful creation or update of the citizen or officer record
- `400 Bad Request` – Missing required fields or invalid data

---

### **5.2 POST /admin/offices/upsert**
Admin endpoint to add or update office information.

**Request**
```json
{
  "id": "GN-001",
  "name": "Grama Niladhari Office - Udawela",
  "division": "Kolonnawa",
  "gnName": "K. Perera",
  "signatureFileId": null
}
```

**Response**
```json
{
  "ok": true,
  "office": {
    "id": "GN-001",
    "name": "Grama Niladhari Office - Udawela",
    "division": "Kolonnawa",
    "gnName": "K. Perera",
    "signatureFileId": null
  }
}
```

**Status Codes**
- `200 OK` – Office data successfully added or updated
- `400 Bad Request` – Missing required fields or invalid data

---

## Notes
- **CITIZEN** can authenticate using NIC and fingerprint, and has the ability to create an account and login using a password.
- **OFFICER** can authenticate using NIC and fingerprint, and can perform actions based on their jurisdiction (GN, DIVSEC, DISTSEC, PROVINCIAL, MINISTRY).
- The **JWT** returned on successful authentication contains **scopes** specific to the actor and their jurisdiction.
- The **admin endpoints** allow for registry and office management, but should only be enabled in **development environments**.

---

# Conclusion

The SLUDI API facilitates a **multi-actor authentication system**, providing secure login for both **citizens** and **officers** with different levels of access based on their **jurisdiction**.

For testing, ensure `SLUDI_DEV_ADMIN=true` is set for admin-related functions.
