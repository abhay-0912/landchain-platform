# LandChain API Reference

Base URL: `http://localhost:3000/api/v1`  
Production: `https://api.landchain.io/api/v1`

All endpoints (except auth) require an `Authorization: Bearer <token>` header.

---

## Table of Contents

- [Authentication](#authentication)
- [Properties](#properties)
- [Transfers](#transfers)
- [Mortgages](#mortgages)
- [Tax Records](#tax-records)
- [Documents](#documents)
- [Admin](#admin)
- [Error Codes](#error-codes)

---

## Authentication

### POST /auth/register

Register a new user account.

**Request**

```json
{
  "full_name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "SecurePass@123",
  "phone": "+91-9876543210",
  "role": "citizen"
}
```

| Field       | Type   | Required | Notes                                      |
|-------------|--------|----------|--------------------------------------------|
| `full_name` | string | ✅       | 2–255 characters                           |
| `email`     | string | ✅       | Must be unique                             |
| `password`  | string | ✅       | Minimum 8 characters                       |
| `phone`     | string | —        |                                            |
| `role`      | string | —        | One of: `citizen`, `officer`, `bank`. Defaults to `citizen`. `admin` requires existing admin approval. |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "full_name": "Arjun Sharma",
      "email": "arjun@example.com",
      "role": "citizen",
      "kyc_status": "pending",
      "created_at": "2024-01-15T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/login

Authenticate and receive a JWT token.

**Request**

```json
{
  "email": "arjun@example.com",
  "password": "SecurePass@123"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "full_name": "Arjun Sharma",
      "email": "arjun@example.com",
      "role": "citizen",
      "kyc_status": "verified",
      "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /auth/me

Return the profile of the currently authenticated user.

**Headers**

```
Authorization: Bearer <token>
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "11111111-1111-1111-1111-111111111111",
    "full_name": "Arjun Sharma",
    "email": "arjun@example.com",
    "phone": "+91-9876543210",
    "role": "citizen",
    "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "kyc_status": "verified",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### PUT /auth/me

Update the authenticated user's profile.

**Request**

```json
{
  "full_name": "Arjun K. Sharma",
  "phone": "+91-9876543299",
  "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": { "...updated user object..." }
}
```

---

### POST /auth/kyc

Submit KYC documents for verification.

**Request** (multipart/form-data)

| Field           | Type | Required | Notes                          |
|-----------------|------|----------|--------------------------------|
| `aadhaar`       | file | ✅       | PDF or image, max 5 MB         |
| `pan`           | file | ✅       | PDF or image, max 5 MB         |
| `address_proof` | file | ✅       | PDF or image, max 5 MB         |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "kyc_status": "submitted",
    "message": "KYC documents submitted successfully. Verification typically takes 24-48 hours."
  }
}
```

---

## Properties

### GET /properties

List properties. Citizens see only their own; officers and admins see all.

**Query Parameters**

| Parameter   | Type    | Notes                                    |
|-------------|---------|------------------------------------------|
| `page`      | integer | Default: 1                               |
| `limit`     | integer | Default: 20, max: 100                    |
| `city`      | string  | Filter by city                           |
| `state`     | string  | Filter by state                          |
| `status`    | string  | `active`, `pending`, `transferred`, etc. |
| `land_type` | string  | `residential`, `commercial`, etc.        |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "property_id": "PROP-MH-2024-001",
        "survey_number": "SRV/MH/PUNE/2024/001",
        "owner": {
          "id": "11111111-1111-1111-1111-111111111111",
          "full_name": "Arjun Sharma"
        },
        "area": "1200.0000",
        "city": "Pune",
        "state": "Maharashtra",
        "land_type": "residential",
        "status": "active",
        "is_mortgaged": false,
        "registration_date": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

### POST /properties

Register a new property. Requires `citizen`, `officer`, or `admin` role.

**Request** (multipart/form-data)

| Field            | Type    | Required | Notes                         |
|------------------|---------|----------|-------------------------------|
| `survey_number`  | string  | ✅       | Must be unique                |
| `area`           | number  | ✅       | In square metres              |
| `coordinates`    | string  | ✅       | `"lat,long"` format           |
| `city`           | string  | ✅       |                               |
| `state`          | string  | ✅       |                               |
| `land_type`      | string  | —        | Default: `residential`        |
| `title_document` | file    | ✅       | PDF, max 10 MB                |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "property_id": "PROP-MH-2024-001",
    "survey_number": "SRV/MH/PUNE/2024/001",
    "blockchain_property_id": 1,
    "blockchain_tx_hash": "0xabc...",
    "ipfs_doc_hash": "QmTzQ1JR...",
    "status": "active",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### GET /properties/search

Full-text and geo search for properties. Public endpoint (returns limited fields).

**Query Parameters**

| Parameter  | Type   | Notes                                 |
|------------|--------|---------------------------------------|
| `q`        | string | Search in city, state, survey number  |
| `city`     | string |                                       |
| `state`    | string |                                       |
| `min_area` | number | Minimum area in sq. metres            |
| `max_area` | number | Maximum area in sq. metres            |

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "property_id": "PROP-MH-2024-001",
        "survey_number": "SRV/MH/PUNE/2024/001",
        "area": "1200.0000",
        "city": "Pune",
        "state": "Maharashtra",
        "land_type": "residential",
        "status": "active"
      }
    ]
  }
}
```

---

### GET /properties/:id

Get full details of a single property.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "property_id": "PROP-MH-2024-001",
    "survey_number": "SRV/MH/PUNE/2024/001",
    "owner": {
      "id": "11111111-1111-1111-1111-111111111111",
      "full_name": "Arjun Sharma",
      "wallet_address": "0xf39Fd..."
    },
    "area": "1200.0000",
    "coordinates": "18.5204,73.8567",
    "latitude": "18.52040000",
    "longitude": "73.85670000",
    "city": "Pune",
    "state": "Maharashtra",
    "land_type": "residential",
    "status": "active",
    "is_mortgaged": false,
    "blockchain_property_id": 1,
    "blockchain_tx_hash": "0xabc...",
    "ipfs_doc_hash": "QmTzQ1JR...",
    "registration_date": "2024-01-15T10:00:00.000Z",
    "ownership_history": [
      {
        "owner": { "full_name": "Arjun Sharma" },
        "transfer_type": "registration",
        "transfer_date": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### PUT /properties/:id

Update a property's metadata. Owner or admin only.

**Request**

```json
{
  "coordinates": "18.5204,73.8600",
  "ipfs_doc_hash": "QmNewDocHash..."
}
```

---

## Transfers

### POST /transfers

Initiate a property transfer. Seller must be the current owner.

**Request**

```json
{
  "property_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "buyer_id": "55555555-5555-5555-5555-555555555555",
  "sale_price": 7500000.00,
  "transaction_type": "sale",
  "agreement_hash": "QmAgreement..."
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "tttttttt-tttt-tttt-tttt-tttttttttttt",
    "property_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "seller_id": "11111111-1111-1111-1111-111111111111",
    "buyer_id": "55555555-5555-5555-5555-555555555555",
    "sale_price": "7500000.00",
    "status": "pending",
    "blockchain_transfer_id": 1,
    "created_at": "2024-06-01T09:00:00.000Z"
  }
}
```

---

### GET /transfers

List transfers. Filtered by caller's role.

**Query Parameters**

| Parameter | Type   | Notes                                           |
|-----------|--------|-------------------------------------------------|
| `status`  | string | `pending`, `buyer_confirmed`, `officer_approved`, `completed`, `cancelled` |
| `page`    | int    | Default: 1                                      |
| `limit`   | int    | Default: 20                                     |

---

### GET /transfers/:id

Get details of a single transfer.

---

### POST /transfers/:id/confirm

Buyer confirms the transfer terms.

**Roles:** `citizen` (buyer), `admin`

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "tttttttt-tttt-tttt-tttt-tttttttttttt",
    "status": "buyer_confirmed"
  }
}
```

---

### POST /transfers/:id/approve

Land officer approves the transfer after due diligence.

**Roles:** `officer`, `admin`

**Request**

```json
{
  "notes": "All documents verified. Transfer approved."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "tttttttt-tttt-tttt-tttt-tttttttttttt",
    "status": "officer_approved"
  }
}
```

---

### POST /transfers/:id/complete

Finalise the transfer; updates ownership on-chain and in the database.

**Roles:** Seller, buyer, or `admin`

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "tttttttt-tttt-tttt-tttt-tttttttttttt",
    "status": "completed",
    "completed_at": "2024-06-10T15:30:00.000Z",
    "blockchain_tx_hash": "0xdef..."
  }
}
```

---

### POST /transfers/:id/cancel

Cancel a non-completed transfer.

**Roles:** Seller, buyer, or `admin`

**Request**

```json
{
  "reason": "Buyer withdrew from the agreement."
}
```

---

## Mortgages

### POST /mortgages

Lock a property as mortgage collateral.

**Roles:** `bank`, `admin`

**Request** (multipart/form-data)

| Field                | Type   | Required | Notes                |
|----------------------|--------|----------|----------------------|
| `property_id`        | UUID   | ✅       |                      |
| `loan_amount`        | number | ✅       |                      |
| `loan_account_number`| string | —        |                      |
| `end_date`           | string | ✅       | ISO 8601             |
| `mortgage_deed`      | file   | ✅       | PDF, max 10 MB       |
| `notes`              | string | —        |                      |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "property_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "loan_amount": "5000000.00",
    "status": "active",
    "blockchain_mortgage_id": 1,
    "blockchain_tx_hash": "0xghi...",
    "start_date": "2024-06-01T00:00:00.000Z",
    "end_date": "2039-06-01T00:00:00.000Z"
  }
}
```

---

### GET /mortgages

List mortgages. Banks see their own; admin sees all.

---

### GET /mortgages/:id

Get mortgage details.

---

### POST /mortgages/:id/release

Release a mortgage after loan repayment.

**Roles:** The originating `bank` or `admin`

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "status": "released",
    "blockchain_tx_hash": "0xjkl..."
  }
}
```

---

## Tax Records

### GET /tax-records

List tax records for the caller's properties (or all properties for officer/admin).

**Query Parameters**

| Parameter     | Type    | Notes                               |
|---------------|---------|-------------------------------------|
| `property_id` | UUID    | Filter by property                  |
| `tax_year`    | integer | Filter by year                      |
| `status`      | string  | `pending`, `paid`, `overdue`, `waived` |

---

### POST /tax-records

Create a tax record for a property.

**Roles:** `officer`, `admin`

**Request**

```json
{
  "property_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "tax_year": 2024,
  "amount": 13200.00,
  "due_date": "2024-03-31T00:00:00.000Z"
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "property_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "tax_year": 2024,
    "amount": "13200.00",
    "status": "pending",
    "due_date": "2024-03-31T00:00:00.000Z"
  }
}
```

---

### POST /tax-records/:id/pay

Mark a tax record as paid.

**Roles:** Property owner or `admin`

**Request**

```json
{
  "payment_reference": "PMC-2024-00789012",
  "receipt_hash": "QmReceiptHash..."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "id": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "status": "paid",
    "paid_date": "2024-03-10T12:00:00.000Z",
    "payment_reference": "PMC-2024-00789012"
  }
}
```

---

## Documents

### POST /documents

Upload a document and pin it to IPFS.

**Request** (multipart/form-data)

| Field           | Type   | Required | Notes                                     |
|-----------------|--------|----------|-------------------------------------------|
| `property_id`   | UUID   | ✅       |                                           |
| `document_type` | string | ✅       | `sale_deed`, `registry_doc`, `tax_receipt`, `court_order`, `survey_map`, `mutation_order`, `mortgage_doc`, `identity_proof`, `other` |
| `file`          | file   | ✅       | PDF/image, max 10 MB                      |

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "property_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "document_type": "sale_deed",
    "file_name": "sale_deed_2024.pdf",
    "ipfs_hash": "QmDocumentHash...",
    "ipfs_url": "https://gateway.pinata.cloud/ipfs/QmDocumentHash...",
    "file_size": 204800,
    "mime_type": "application/pdf",
    "blockchain_verified": false,
    "created_at": "2024-06-01T10:00:00.000Z"
  }
}
```

---

### GET /documents

List documents for a property.

**Query Parameters**

| Parameter       | Type   | Notes                    |
|-----------------|--------|--------------------------|
| `property_id`   | UUID   | ✅ Required              |
| `document_type` | string | Optional filter          |

---

### GET /documents/:id

Get document metadata and IPFS URL.

---

## Admin

All admin endpoints require `admin` role.

### GET /admin/users

List all users with pagination and filters.

**Query Parameters**

| Parameter  | Type   | Notes                                        |
|------------|--------|----------------------------------------------|
| `role`     | string | `citizen`, `officer`, `bank`, `admin`        |
| `kyc_status` | string | `pending`, `submitted`, `verified`, `rejected` |
| `is_active` | boolean |                                             |
| `page`     | int    |                                              |
| `limit`    | int    |                                              |

---

### PUT /admin/users/:id/kyc

Update a user's KYC status.

**Request**

```json
{
  "kyc_status": "verified",
  "notes": "Documents verified against government records."
}
```

---

### PUT /admin/users/:id/activate

Activate or deactivate a user account.

**Request**

```json
{
  "is_active": false,
  "reason": "Suspicious activity detected."
}
```

---

### GET /admin/audit-logs

Query the audit log.

**Query Parameters**

| Parameter      | Type   | Notes                   |
|----------------|--------|-------------------------|
| `user_id`      | UUID   | Filter by user          |
| `action`       | string | Filter by action name   |
| `resource_type`| string |                         |
| `from`         | string | ISO 8601 start date     |
| `to`           | string | ISO 8601 end date       |
| `page`         | int    |                         |
| `limit`        | int    |                         |

---

### GET /admin/stats

Platform-wide statistics.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "users": { "total": 1200, "by_role": { "citizen": 1150, "officer": 30, "bank": 15, "admin": 5 } },
    "properties": { "total": 3420, "by_status": { "active": 3100, "mortgaged": 280, "transferred": 40 } },
    "transactions": { "total": 540, "completed": 490, "pending": 50 },
    "mortgages": { "active": 280, "released": 95 }
  }
}
```

---

## Error Codes

All error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property with the given ID does not exist.",
    "details": []
  }
}
```

| HTTP Status | Error Code                  | Description                                       |
|-------------|-----------------------------|---------------------------------------------------|
| 400         | `VALIDATION_ERROR`          | One or more input fields failed validation        |
| 400         | `DUPLICATE_SURVEY_NUMBER`   | Survey number already registered                  |
| 400         | `PROPERTY_MORTGAGED`        | Cannot transfer a mortgaged property              |
| 400         | `TRANSFER_NOT_IN_STATE`     | Transfer is not in the expected state             |
| 400         | `ACTIVE_MORTGAGE_EXISTS`    | Property already has an active mortgage           |
| 401         | `UNAUTHORIZED`              | Missing or invalid JWT token                      |
| 403         | `FORBIDDEN`                 | Insufficient role for this action                 |
| 403         | `NOT_OWNER`                 | Caller is not the property owner                  |
| 403         | `KYC_NOT_VERIFIED`          | User KYC is not yet verified                      |
| 404         | `USER_NOT_FOUND`            | User does not exist                               |
| 404         | `PROPERTY_NOT_FOUND`        | Property does not exist                           |
| 404         | `TRANSFER_NOT_FOUND`        | Transfer does not exist                           |
| 404         | `MORTGAGE_NOT_FOUND`        | Mortgage does not exist                           |
| 409         | `ACTIVE_TRANSFER_EXISTS`    | Property already has an active transfer in progress |
| 413         | `FILE_TOO_LARGE`            | Uploaded file exceeds the size limit              |
| 422         | `BLOCKCHAIN_ERROR`          | On-chain transaction failed or reverted           |
| 422         | `IPFS_UPLOAD_ERROR`         | Failed to pin document to IPFS                    |
| 429         | `RATE_LIMIT_EXCEEDED`       | Too many requests — try again later               |
| 500         | `INTERNAL_SERVER_ERROR`     | Unexpected server error                           |
