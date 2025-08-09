# CodeX-hackathon


# DPI Mock Services – Setup & Run

This repository contains mock services to simulate the **SLUDI**, **NDX**, and **PayDPI** systems used for secure citizen and officer authentication, data management, and payment processing.

---

## Services Overview

- **SLUDI**: Secure Login & Unified Digital Identity system for citizens and officers.
- **NDX**: National Data Exchange system to manage citizen and officer profiles, document management, and file uploads.
- **PayDPI**: Payment Gateway system to manage payment intents, confirmations, refunds, and webhooks.

---

## Prerequisites

- **Node.js**: Version 14 or later
- **npm**: Version 6 or later
- **Environment Variables**: `.env` files for configuration

---

## Setting Up

### 1. Clone the Repository

Clone this repository to your local machine:

```bash
git clone https://github.com/Sarinduu/CodeX-hackathon.git
cd src/dpi-mock-server
```

### 2. Install Dependencies

For each service (`SLUDI`, `NDX`, and `PayDPI`), install the dependencies using npm.

```bash
npm --prefix services/sludi i
npm --prefix services/ndx i
npm --prefix services/paydpi i
```

---

## Configuration

Each service uses environment variables for configuration. Create an `.env` file in the root directory and configure it accordingly:

### `.env`
```bash
SLUDI_PORT=4001
NDX_PORT=4002
PAYDPI_PORT=4003
CORS_ORIGIN=*

SLUDI_JWT_SECRET=dev-super-secret   
SLUDI_TOKEN_TTL=90000                
SLUDI_DEV_ADMIN=true               

PAYDPI_WEBHOOK_SECRET=paydpi-webhook-secret
PAYDPI_DEFAULT_CURRENCY=LKR
PAYDPI_INTENT_TTL=1800
PAYDPI_OFFICER_CREATE_ANY=true
```

---

## Running the Services

Each service can be run separately in different terminal windows or run in one terminal window. Follow the steps below for each service:

### **For all**

1. Navigate to the **root** directory:
    
2. Start the all services:
    ```bash
    npm run dev:all
    ```

### **SLUDI** (Secure Login System)

1. Navigate to the **SLUDI** directory:
    ```bash
    cd sludi
    ```
2. Start the SLUDI service:
    ```bash
    npm start
    ```

### **NDX** (National Data Exchange)

1. Navigate to the **NDX** directory:
    ```bash
    cd ndx
    ```
2. Start the NDX service:
    ```bash
    npm start
    ```

### **PayDPI** (Payment Gateway)

1. Navigate to the **PayDPI** directory:
    ```bash
    cd paydpi
    ```
2. Start the PayDPI service:
    ```bash
    npm start
    ```

---

## Accessing the APIs

Once all services are running, you can access their APIs locally on the following ports:

- **SLUDI**: `http://localhost:4001`
- **NDX**: `http://localhost:4002`
- **PayDPI**: `http://localhost:4003`

You can use these endpoints to interact with the services:

- **SLUDI**: Authentication and login processes.
- **NDX**: Manage citizen and officer data, file uploads, and document processing.
- **PayDPI**: Create payment intents, confirm payments, and manage refunds.

---

## Testing Webhooks

To test PayDPI's webhook functionality, you can simulate webhook payloads by sending POST requests to:

```bash
POST /simulate-webhook
```

This endpoint will simulate an event (e.g., `payment.succeeded`) and provide the payload and signature for testing.

---

## Idempotency

For the **PayDPI** service, you can ensure safe retries by using the `Idempotency-Key` header when making the following requests:

- **POST /payments/intents**: Creating a payment intent.
- **POST /payments/confirm**: Confirming a payment.
- **POST /payments/cancel**: Cancelling a payment intent.
- **POST /payments/refund**: Refunds for payments.

The `Idempotency-Key` allows for retrying requests without creating duplicate payments or actions.

---

## Troubleshooting

1. **Missing `.env` values**: Ensure all required environment variables are set in the `.env` file.
2. **Port Conflicts**: If any port is already in use, you can change the port number in the `.env` file for each service.
3. **JWT Token Issues**: Make sure the JWT is correctly signed with the secret in the `.env` file (`SLUDI_JWT_SECRET`).

---

## Conclusion

This setup allows you to run and interact with mock services for authentication, data management, and payment processing. Each service is self-contained and can be easily extended for further integration with real systems.

For any issues, feel free to raise an issue or contribute to the repository.

---

### License

This project is licensed under the MIT License – see the LICENSE file for details.
