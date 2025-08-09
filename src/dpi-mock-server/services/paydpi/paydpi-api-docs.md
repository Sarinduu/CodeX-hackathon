
# NDX API Documentation – Citizens, Officers, Signatures, and PDF Handling

This service handles **citizens**, **officers**, **signature uploads**, and **process document versioning** using **PDF files**.

---

## 📂 Base URL
```
http://localhost:4002
```

---

## **1. GET /citizens/:nic**
**Description**: Get the details of a citizen by NIC.

**Method**: `GET`

**Request**:
```
GET /citizens/:nic
```

**Response**:
```json
{
  "nic": "200012345678",
  "name": "John Doe",
  "address": "123 Main St",
  "village": "Udawela",
  "division": "Kolonnawa",
  "district": "Colombo",
  "province": "Western",
  "country": "Sri Lanka"
}
```

**Status Codes**:
- `200 OK` – Citizen details retrieved successfully
- `404 Not Found` – Citizen not found

---

## **2. GET /officers/:nic**
**Description**: Get the details of an officer by NIC.

**Method**: `GET`

**Request**:
```
GET /officers/:nic
```

**Response**:
```json
{
  "nic": "901234567V",
  "name": "K. Perera",
  "position": "Grama Niladhari",
  "officeId": "GN-001",
  "jurisdiction": { "villages": ["Udawela"], "country": true }
}
```

**Status Codes**:
- `200 OK` – Officer details retrieved successfully
- `404 Not Found` – Officer not found

---

## **3. GET /officers/:nic/citizens**
**Description**: Get all citizens under an officer's jurisdiction.

**Method**: `GET`

**Request**:
```
GET /officers/:nic/citizens
```

**Response**:
```json
{
  "count": 5,
  "citizens": [
    {
      "nic": "200012345678",
      "name": "John Doe",
      "village": "Udawela"
    },
    {
      "nic": "200012345679",
      "name": "Jane Doe",
      "village": "Udawela"
    }
  ]
}
```

**Status Codes**:
- `200 OK` – List of citizens under the officer's jurisdiction
- `403 Forbidden` – Only officers can access this data
- `404 Not Found` – Officer not found

---

## **4. POST /officers/:nic/signature**
**Description**: Add a signature for an officer (file upload).

**Method**: `POST`

**Request**:
```
POST /officers/:nic/signature
Content-Type: multipart/form-data
{
  "file": "<file>"
}
```

**Response**:
```json
{
  "ok": true,
  "officerNic": "901234567V",
  "signatureFileId": "file-123456",
  "url": "/files/file-123456"
}
```

**Status Codes**:
- `200 OK` – Signature added successfully
- `403 Forbidden` – Unauthorized access
- `400 Bad Request` – Missing or invalid file

---

## **5. GET /officers/:nic/signature**
**Description**: Get an officer's signature (file and metadata).

**Method**: `GET`

**Request**:
```
GET /officers/:nic/signature
```

**Response**:
```json
{
  "signatureFileId": "file-123456",
  "url": "/files/file-123456",
  "meta": {
    "filename": "signature.png",
    "mime": "image/png",
    "size": 1024,
    "createdAt": "2025-07-31T10:00:00Z",
    "uploadedBy": "admin"
  }
}
```

**Status Codes**:
- `200 OK` – Signature retrieved successfully
- `404 Not Found` – Signature file missing or officer not found

---

## **6. POST /process-docs**
**Description**: Create or add a new version to a process document (PDF upload).

**Method**: `POST`

**Request**:
```
POST /process-docs
Content-Type: multipart/form-data
{
  "citizenNic": "200012345678",
  "processType": "BIRTH_CERT",
  "referenceNo": "ABC-123",
  "note": "Initial submission",
  "file": "<file>"
}
```

**Response**:
```json
{
  "id": "doc-123456",
  "citizenNic": "200012345678",
  "processType": "BIRTH_CERT",
  "referenceNo": "ABC-123",
  "createdAt": "2025-07-31T10:00:00Z",
  "versions": [
    {
      "v": 1,
      "fileId": "file-123456",
      "note": "Initial submission",
      "ts": "2025-07-31T10:00:00Z",
      "updatedBy": "admin"
    }
  ]
}
```

**Status Codes**:
- `200 OK` – Document created successfully
- `400 Bad Request` – Missing required fields or invalid data
- `404 Not Found` – Citizen not found

---

## **7. PUT /process-docs/:docId/versions**
**Description**: Add a new version to an existing process document.

**Method**: `PUT`

**Request**:
```
PUT /process-docs/:docId/versions
Content-Type: multipart/form-data
{
  "fileId": "file-789012",
  "note": "Corrected information",
  "file": "<file>"
}
```

**Response**:
```json
{
  "ok": true,
  "docId": "doc-123456",
  "newVersion": {
    "v": 2,
    "fileId": "file-789012",
    "note": "Corrected information",
    "ts": "2025-07-31T10:30:00Z",
    "updatedBy": "admin"
  }
}
```

**Status Codes**:
- `200 OK` – Version added successfully
- `400 Bad Request` – Missing required fields or invalid data
- `404 Not Found` – Document or file not found

---

## **8. GET /process-docs/:docId**
**Description**: Get the full metadata and version history of a process document.

**Method**: `GET`

**Request**:
```
GET /process-docs/:docId
```

**Response**:
```json
{
  "id": "doc-123456",
  "citizenNic": "200012345678",
  "processType": "BIRTH_CERT",
  "referenceNo": "ABC-123",
  "createdAt": "2025-07-31T10:00:00Z",
  "versions": [
    {
      "v": 1,
      "fileId": "file-123456",
      "note": "Initial submission",
      "ts": "2025-07-31T10:00:00Z",
      "updatedBy": "admin"
    }
  ]
}
```

**Status Codes**:
- `200 OK` – Document metadata and versions retrieved successfully
- `404 Not Found` – Document not found

---

## **9. GET /process-docs/:docId/latest**
**Description**: Get the latest version of a process document along with the file URL.

**Method**: `GET`

**Request**:
```
GET /process-docs/:docId/latest
```

**Response**:
```json
{
  "docId": "doc-123456",
  "version": {
    "v": 2,
    "fileId": "file-789012",
    "note": "Corrected information",
    "ts": "2025-07-31T10:30:00Z",
    "updatedBy": "admin"
  },
  "file": {
    "filename": "updated_document.pdf",
    "mime": "application/pdf",
    "size": 2048
  },
  "url": "/files/file-789012"
}
```

**Status Codes**:
- `200 OK` – Latest version retrieved successfully
- `404 Not Found` – Document not found

---

## **10. GET /citizens/:nic/process-docs**
**Description**: List all process documents associated with a citizen.

**Method**: `GET`

**Request**:
```
GET /citizens/:nic/process-docs
```

**Response**:
```json
{
  "count": 2,
  "docs": [
    {
      "id": "doc-123456",
      "processType": "BIRTH_CERT",
      "referenceNo": "ABC-123",
      "createdAt": "2025-07-31T10:00:00Z"
    },
    {
      "id": "doc-654321",
      "processType": "GRANT",
      "referenceNo": "XYZ-987",
      "createdAt": "2025-07-31T10:30:00Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK` – Documents listed successfully
- `404 Not Found` – Citizen not found

---

## Notes
- **CITIZEN**: Can create and view their own process documents.
- **OFFICER**: Can view and update documents for citizens within their jurisdiction.
- **Document Versions**: Documents can have multiple versions, and each version is associated with a file and update details.

---

# Conclusion

The NDX API facilitates **citizen** and **officer** management, including signature uploads and **process document versioning**. Citizens can upload, modify, and view process documents, while officers can authenticate and manage citizens' documents based on their jurisdiction.

