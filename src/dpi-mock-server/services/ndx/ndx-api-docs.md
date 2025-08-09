
# NDX API Documentation – Data & Files Service

This service handles citizen and officer profiles, file uploads, process PDF versions, and signature management.

---

## 📂 Base URL
```
http://localhost:4002
```

---

## **1. POST /files/upload**
Upload a file (PDF, image, etc.)

**Request** (multipart)
```json
{
  "file": "<file_to_upload>"
}
```

**Response**
```json
{
  "fileId": "1234-...",
  "filename": "2023-02-01-abc.pdf",
  "path": "/uploads/2023-02-01-abc.pdf",
  "mime": "application/pdf",
  "size": 25000,
  "createdAt": 1633078400000,
  "uploadedBy": "200012345678"
}
```

**Status Codes**
- `200 OK` – File uploaded successfully
- `400 Bad Request` – Missing file or invalid file type

---

## **2. GET /files/:id**
Serve an uploaded file by its ID.

**Example**
```
GET /files/1234-...
```

**Response** (raw file download)

**Status Codes**
- `200 OK` – File found and served
- `404 Not Found` – File not found

---

## **3. GET /citizens/:nic**
Retrieve a citizen profile.

**Example**
```
GET /citizens/200012345678
```

**Response**
```json
{
  "nic": "200012345678",
  "name": "Test Citizen",
  "dob": "2000-01-01",
  "city": "Kandy",
  "village": "Udawela",
  "address": "No. 5, Main Rd",
  "phone": "0771234567",
  "email": "test.citizen@example.com",
  "docs": ["1234-..."],
  "signatureId": "abcd-..."
}
```

**Status Codes**
- `200 OK` – Citizen profile found
- `404 Not Found` – Citizen profile not found
- `403 Forbidden` – Unauthorized access (not self or within officer's jurisdiction)

---

## **4. PUT /citizens/:nic**
Update a citizen profile (self or within officer's jurisdiction).

**Request**
```json
{
  "name": "Updated Test Citizen",
  "address": "No. 6, New Rd",
  "phone": "0779999999",
  "email": "updated.citizen@example.com",
  "docs": ["1234-..."],
  "signatureId": "abcd-..."
}
```

**Response**
```json
{
  "nic": "200012345678",
  "name": "Updated Test Citizen",
  "dob": "2000-01-01",
  "city": "Kandy",
  "village": "Udawela",
  "address": "No. 6, New Rd",
  "phone": "0779999999",
  "email": "updated.citizen@example.com",
  "docs": ["1234-..."],
  "signatureId": "abcd-..."
}
```

**Status Codes**
- `200 OK` – Profile updated
- `403 Forbidden` – Unauthorized access
- `404 Not Found` – Citizen profile not found

---

## **5. GET /officer/citizens**
List citizens within the officer’s jurisdiction.

**Response**
```json
{
  "count": 5,
  "citizens": [
    {
      "nic": "200012345678",
      "name": "Test Citizen",
      "dob": "2000-01-01",
      "city": "Kandy",
      "village": "Udawela"
    }
  ]
}
```

**Status Codes**
- `200 OK` – Citizens found within jurisdiction
- `403 Forbidden` – Officer not allowed to access citizens

---

## **6. GET /officers/:nic**
Retrieve an officer's profile.

**Example**
```
GET /officers/901234567V
```

**Response**
```json
{
  "nic": "901234567V",
  "name": "K. Perera",
  "type": "GN Officer",
  "officeId": "GN-001",
  "jurisdiction": { "villages": ["Udawela"] },
  "signatureFileId": "file-1234-..."
}
```

**Status Codes**
- `200 OK` – Officer profile found
- `404 Not Found` – Officer not found
- `403 Forbidden` – Unauthorized access

---

## **7. POST /officers/:nic/signature**
Assign a signature file to an officer.

**Request**
```json
{
  "fileId": "file-1234-..."
}
```

**Response**
```json
{
  "status": "success",
  "message": "Signature assigned",
  "officerNic": "901234567V",
  "signatureFileId": "file-1234-...",
  "url": "/files/1234-..."
}
```

**Status Codes**
- `200 OK` – Signature assigned
- `400 Bad Request` – Missing or invalid fileId
- `404 Not Found` – File not found

---

## **8. GET /officers/:nic/signature**
Retrieve officer's signature metadata.

**Example**
```
GET /officers/901234567V/signature
```

**Response**
```json
{
  "signatureFileId": "file-1234-...",
  "url": "/files/1234-...",
  "meta": {
    "filename": "signature.png",
    "mime": "image/png",
    "size": 2048,
    "uploadedAt": 1633078400000
  }
}
```

**Status Codes**
- `200 OK` – Signature metadata found
- `404 Not Found` – Signature not found

---

## **9. POST /process-docs**
Create a new document (e.g., PDF, form) related to a citizen.

**Request**
```json
{
  "citizenNic": "200012345678",
  "processType": "BIRTH_CERT",
  "referenceNo": "BC-2025-00123",
  "fileId": "file-1234-...",
  "note": "initial submission"
}
```

**Response**
```json
{
  "id": "doc-1234-...",
  "citizenNic": "200012345678",
  "processType": "BIRTH_CERT",
  "referenceNo": "BC-2025-00123",
  "createdAt": 1633078400000,
  "createdBy": "901234567V",
  "versions": [
    { "v": 1, "fileId": "file-1234-...", "note": "initial submission", "ts": 1633078400000, "updatedBy": "901234567V" }
  ]
}
```

**Status Codes**
- `200 OK` – Document created successfully
- `400 Bad Request` – Missing required fields or invalid data

---

## **10. PUT /process-docs/:docId/versions**
Add a new version to an existing document.

**Request**
```json
{
  "fileId": "file-5678-...",
  "note": "corrected spelling"
}
```

**Response**
```json
{
  "ok": true,
  "docId": "doc-1234-...",
  "latestVersion": 2
}
```

**Status Codes**
- `200 OK` – Version added successfully
- `400 Bad Request` – Missing required fields or invalid data

---

## **11. GET /process-docs/:docId/latest**
Get the latest version and associated file URL for a document.

**Response**
```json
{
  "docId": "doc-1234-...",
  "version": {
    "v": 2,
    "fileId": "file-5678-...",
    "note": "corrected spelling",
    "ts": 1633079500000,
    "updatedBy": "901234567V"
  },
  "file": {
    "id": "file-5678-...",
    "filename": "birth_cert.pdf",
    "url": "/files/5678-...",
    "mime": "application/pdf",
    "size": 30000
  }
}
```

**Status Codes**
- `200 OK` – Latest version and file URL returned
- `404 Not Found` – Document not found

---

## **12. GET /citizens/:nic/process-docs**
List all documents for a citizen.

**Example**
```
GET /citizens/200012345678/process-docs
```

**Response**
```json
{
  "count": 2,
  "docs": [
    {
      "id": "doc-1234-...",
      "citizenNic": "200012345678",
      "processType": "BIRTH_CERT",
      "referenceNo": "BC-2025-00123",
      "versions": [
        { "v": 1, "fileId": "file-1234-...", "note": "initial submission", "ts": 1633078400000, "updatedBy": "901234567V" }
      ]
    }
  ]
}
```

**Status Codes**
- `200 OK` – Documents found for the citizen
- `404 Not Found` – Citizen not found

---

## Notes
- **CITIZEN** can only access their own documents and profile.
- **OFFICER** can access documents and profiles within their jurisdiction (GN, DIVSEC, DISTSEC, PROVINCIAL, MINISTRY).
- The **JWT** contains claims for determining scope of access for officers.
- File uploads are handled by **`/files/upload`** endpoint and returned metadata is used in documents.

---

# Conclusion
The NDX API provides services for **citizens**, **officers**, and **files**. Officers can view and manage documents for citizens within their jurisdiction, while citizens can manage their own documents and profiles.

