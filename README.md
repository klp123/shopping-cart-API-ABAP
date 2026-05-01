# Shopping Cart & Order Management API

A RESTful API built with **Node.js** and **Express** for managing shopping carts and placing orders. This service handles cart operations (add, update, remove items, apply coupons) and order placement with price snapshots.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Cart Endpoints](#cart-endpoints)
  - [Order Endpoints](#order-endpoints)
- [Business Rules](#business-rules)
- [Validation](#validation)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Coupon Codes](#coupon-codes)

---

## Tech Stack

| Layer        | Library / Tool          |
|--------------|-------------------------|
| Runtime      | Node.js                 |
| Framework    | Express 4               |
| Validation   | Zod                     |
| ID generation| uuid v4                 |
| CORS         | cors                    |
| Config       | dotenv                  |
| Testing      | Jest + Supertest        |
| Dev server   | nodemon                 |

---

## Project Structure

```
nodejs/
├── server.js                  # Entry point — starts HTTP server, graceful shutdown
├── package.json
└── src/
    ├── app.js                 # Express app setup, middleware, routes
    ├── config/
    │   └── constants.js       # MAX_QTY, COUPONS config
    ├── data/
    │   └── store.js           # In-memory data store (carts & orders)
    ├── middleware/
    │   ├── errorHandler.js    # Global error handler (AppError, ZodError, unknown)
    │   └── validate.js        # Zod schema validation middleware
    ├── routes/
    │   ├── cart.routes.js     # Cart route handlers
    │   └── order.routes.js    # Order route handlers
    ├── schemas/
    │   ├── cart.schemas.js    # Zod schemas for cart requests
    │   └── order.schemas.js   # Zod schemas for order requests
    └── services/
        ├── cartService.js     # Cart business logic
        └── orderService.js    # Order business logic
tests/
├── integration/
│   ├── cart.routes.test.js
│   └── order.routes.test.js
└── unit/
    ├── cartService.test.js
    └── orderService.test.js
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
npm install
```

### Run in development mode (with auto-reload)

```bash
npm run dev
```

### Run in production mode

```bash
npm start
```

The server starts at `http://localhost:3000` by default.

---

## Environment Variables

Create a `.env` file in the project root (optional — all values have defaults):

```env
PORT=3000
NODE_ENV=development
```

| Variable   | Default       | Description           |
|------------|---------------|-----------------------|
| `PORT`     | `3000`        | HTTP server port      |
| `NODE_ENV` | `development` | Runtime environment   |

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Health Check

| Method | Endpoint  | Description          |
|--------|-----------|----------------------|
| GET    | `/health` | Service health check |

**Response `200`:**
```json
{
  "status": "OK",
  "timestamp": "2026-05-01T10:00:00.000Z"
}
```

---

### Cart Endpoints

#### Get Cart

```
GET /api/v1/cart/:sessionId
```

Returns the cart for the given session. Creates an empty cart if none exists.

**Response `200`:**
```json
{
  "sessionId": "abc123",
  "items": [
    {
      "itemId": "uuid-v4",
      "productId": "prod-001",
      "name": "Wireless Mouse",
      "price": 499,
      "quantity": 2,
      "lineTotal": 998
    }
  ],
  "coupon": null,
  "discount": 0,
  "subtotal": 998,
  "total": 998
}
```

---

#### Add Item to Cart

```
POST /api/v1/cart/:sessionId/items
```

Adds a product to the cart. If the product already exists, its quantity is accumulated.

**Request Body:**
```json
{
  "productId": "prod-001",
  "name": "Wireless Mouse",
  "price": 499,
  "quantity": 2
}
```

| Field       | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| `productId` | string | Yes      | Non-empty string               |
| `name`      | string | Yes      | Non-empty string               |
| `price`     | number | Yes      | Must be positive               |
| `quantity`  | number | Yes      | Integer, 1–10 (see BR-01)      |

**Response `201`:** Updated cart object.

---

#### Update Item Quantity

```
PUT /api/v1/cart/:sessionId/items/:itemId
```

Updates the quantity of an existing cart item.

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response `200`:** Updated cart object.

---

#### Remove Item from Cart

```
DELETE /api/v1/cart/:sessionId/items/:itemId
```

Removes an item from the cart.

**Response `200`:** Updated cart object.

---

#### Apply Coupon

```
POST /api/v1/cart/:sessionId/coupon
```

Applies a fixed-discount coupon code to the cart.

**Request Body:**
```json
{
  "code": "SAVE100"
}
```

**Response `200`:** Updated cart object with discount applied.

---

### Order Endpoints

#### Create Order

```
POST /api/v1/orders
```

Creates an order from the current cart state. Snapshots item prices at order time, then clears the cart.

**Request Body:**
```json
{
  "sessionId": "abc123",
  "userId": "user-456"
}
```

| Field       | Type   | Required |
|-------------|--------|----------|
| `sessionId` | string | Yes      |
| `userId`    | string | Yes      |

**Response `201`:**
```json
{
  "orderId": "uuid-v4",
  "userId": "user-456",
  "sessionId": "abc123",
  "items": [
    {
      "productId": "prod-001",
      "name": "Wireless Mouse",
      "price": 499,
      "quantity": 2,
      "lineTotal": 998
    }
  ],
  "subtotal": 998,
  "discount": 100,
  "coupon": "SAVE100",
  "total": 898,
  "status": "PLACED",
  "createdAt": "2026-05-01T10:00:00.000Z"
}
```

---

#### Get Order by ID

```
GET /api/v1/orders/:orderId
```

Returns full order details including the item snapshot.

**Response `200`:** Order object (same structure as above).

**Response `404`:**
```json
{ "error": "Order not found" }
```

---

## Business Rules

| Rule   | Description                                                                                   |
|--------|-----------------------------------------------------------------------------------------------|
| BR-01  | Maximum quantity per cart line item is **10**. Exceeding this returns `400`.                  |
| BR-02  | An order cannot be placed on an empty cart. Returns `422`.                                    |
| BR-03  | Only supported coupon codes are accepted (`SAVE50`, `SAVE100`, `SAVE200`). Returns `400` for unknown codes. |
| BR-04  | Only one coupon can be applied per cart. Attempting a second returns `400`.                   |
| BR-05  | Product name and price are **snapshotted** at order time. Future price changes do not affect placed orders. |

---

## Validation

Request bodies are validated using **Zod** schemas via the `validate` middleware. Validation errors return `400` with structured details:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "quantity",
      "message": "quantity cannot exceed 10"
    }
  ]
}
```

---

## Error Handling

All errors are handled by a global Express error handler mounted last in `app.js`.

| Error Type  | Status | Description                                |
|-------------|--------|--------------------------------------------|
| `AppError`  | varies | Business rule violations (400, 404, 422)   |
| `ZodError`  | 400    | Request body validation failure            |
| Unknown     | 500    | Unhandled internal server error            |

---

## Testing

### Run all tests

```bash
npm test
```

### Run unit tests only

```bash
npm run test:unit
```

### Run integration tests only

```bash
npm run test:integration
```

### Run with coverage report

```bash
npm run test:coverage
```

Coverage thresholds (enforced by Jest):

| Metric      | Minimum |
|-------------|---------|
| Lines       | 70%     |
| Functions   | 70%     |
| Branches    | 70%     |
| Statements  | 70%     |

Coverage reports are generated in `coverage/` as HTML, LCOV, and text formats.

### Watch mode

```bash
npm run test:watch
```

---

## Coupon Codes

| Code      | Discount |
|-----------|----------|
| `SAVE50`  | ₹50 off  |
| `SAVE100` | ₹100 off |
| `SAVE200` | ₹200 off |

> Coupons apply a fixed discount to the cart total. Only one coupon can be applied per cart session.
