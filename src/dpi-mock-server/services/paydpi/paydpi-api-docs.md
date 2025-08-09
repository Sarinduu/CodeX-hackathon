
# PayDPI API Documentation – Mock Payment Gateway

This service handles **payment intents** and **payment confirmations** for **citizens** and **officers** using simple API interactions.

---

## 📂 Base URL
```
http://localhost:4003
```

---

## **1. GET /health**
**Description**: Check the health of the PayDPI service.

**Method**: `GET`

**Request**:
```
GET /health
```

**Response**:
```json
{
  "ok": true,
  "service": "PayDPI",
  "time": 1618554674000
}
```

**Status Codes**:
- `200 OK` – Health check successful

---

## **2. POST /payments/intents**
**Description**: Create a new payment intent.

**Method**: `POST`

**Request**:
```json
{
  "amount": 100.50,
  "currency": "LKR",
  "reference": "REF-12345",
  "payerNic": "200012345678"
}
```

**Response**:
```json
{
  "paymentId": "b6d8f033-...",
  "status": "REQUIRES_CONFIRMATION",
  "reference": "REF-12345",
  "expiresAt": 1618558274000
}
```

**Status Codes**:
- `200 OK` – Payment intent created successfully
- `400 Bad Request` – Missing required fields (`amount`, `payerNic`)

---

## **3. POST /payments/confirm**
**Description**: Confirm (authorize and capture) a payment.

**Method**: `POST`

**Request**:
```json
{
  "paymentId": "b6d8f033-...",
  "result": "SUCCESS"
}
```

**Response**:
```json
{
  "paymentId": "b6d8f033-...",
  "status": "SUCCEEDED",
  "reference": "REF-12345"
}
```

**Status Codes**:
- `200 OK` – Payment successfully confirmed
- `400 Bad Request` – Missing `paymentId` or invalid data
- `404 Not Found` – Payment not found
- `401 Unauthorized` – Invalid/expired JWT token

---

## **4. GET /payments/:id**
**Description**: Get details of a specific payment by ID.

**Method**: `GET`

**Request**:
```
GET /payments/b6d8f033-...
```

**Response**:
```json
{
  "paymentId": "b6d8f033-...",
  "status": "SUCCEEDED",
  "payerNic": "200012345678",
  "amount": 100.50,
  "currency": "LKR",
  "reference": "REF-12345",
  "createdAt": 1618554674000
}
```

**Status Codes**:
- `200 OK` – Payment details retrieved successfully
- `404 Not Found` – Payment not found

---

## **5. GET /payments**
**Description**: List payments by reference, payer NIC, or status.

**Method**: `GET`

**Request**:
```
GET /payments?reference=REF-12345&status=SUCCEEDED
```

**Response**:
```json
{
  "count": 2,
  "items": [
    {
      "paymentId": "b6d8f033-...",
      "status": "SUCCEEDED",
      "amount": 100.50,
      "currency": "LKR",
      "reference": "REF-12345"
    },
    {
      "paymentId": "c7d9f033-...",
      "status": "SUCCEEDED",
      "amount": 50.00,
      "currency": "LKR",
      "reference": "REF-67890"
    }
  ]
}
```

**Status Codes**:
- `200 OK` – List of payments retrieved successfully

---

## Notes
- **CITIZEN**: Can create and view payments for themselves.
- **OFFICER**: Can create and view payments for any citizen.
- **Idempotency**: Payments are idempotent, using the header `Idempotency-Key` to ensure that repeated requests do not create duplicate intents or transactions.
- **Webhooks**: PayDPI supports webhook events for payment status updates.

---

# Conclusion

The PayDPI API facilitates payment intent creation, confirmation, and management using a simple payment gateway system. It supports creating and confirming payments, as well as listing and retrieving payment details. The service is protected by **JWT authentication** and supports **idempotency** and **webhooks**.

