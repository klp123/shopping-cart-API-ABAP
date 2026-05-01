'use strict';

/**
 * Integration Tests — Cart Routes
 * Uses Supertest to fire real HTTP requests against the Express app.
 *
 * Run: npm run test:integration
 */

const request    = require('supertest');
const app        = require('../../src/app');
const { resetStore } = require('../../src/data/store');

const SESSION = 'integration-cart-session';

beforeEach(() => {
  resetStore();
});

afterAll(() => {
  resetStore();
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/cart/:sessionId
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/cart/:sessionId', () => {
  it('should return 200 with an empty cart for a new session', async () => {
    const res = await request(app).get(`/api/v1/cart/${SESSION}`);

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(SESSION);
    expect(res.body.items).toEqual([]);
    expect(res.body.subtotal).toBe(0);
  });

  it('should return 200 with items after products are added', async () => {
    await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    const res = await request(app).get(`/api/v1/cart/${SESSION}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.subtotal).toBe(998);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/cart/:sessionId/items
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/cart/:sessionId/items', () => {
  it('should return 201 with the updated cart after adding an item', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.subtotal).toBe(998);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1' }); // missing name, price, quantity

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });

  // BR-01
  it('[BR-01] should return 400 when quantity exceeds 10', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 11 });

    expect(res.status).toBe(400);
  });

  it('should return 400 when price is not a positive number', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: -10, quantity: 1 });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// PUT /api/v1/cart/:sessionId/items/:itemId
// ─────────────────────────────────────────────────────────────
describe('PUT /api/v1/cart/:sessionId/items/:itemId', () => {
  it('should return 200 with the updated cart after qty change', async () => {
    const addRes = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    const itemId = addRes.body.items[0].itemId;

    const res = await request(app)
      .put(`/api/v1/cart/${SESSION}/items/${itemId}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
    expect(res.body.subtotal).toBe(2495);
  });

  // BR-01
  it('[BR-01] should return 400 when updated quantity exceeds 10', async () => {
    const addRes = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    const itemId = addRes.body.items[0].itemId;

    const res = await request(app)
      .put(`/api/v1/cart/${SESSION}/items/${itemId}`)
      .send({ quantity: 11 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds limit/i);
  });

  it('should return 404 when itemId does not exist', async () => {
    const res = await request(app)
      .put(`/api/v1/cart/${SESSION}/items/ghost-id`)
      .send({ quantity: 3 });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/v1/cart/:sessionId/items/:itemId
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/cart/:sessionId/items/:itemId', () => {
  it('should return 200 with updated cart after removing an item', async () => {
    const addRes = await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    const itemId = addRes.body.items[0].itemId;

    const res = await request(app)
      .delete(`/api/v1/cart/${SESSION}/items/${itemId}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.subtotal).toBe(0);
  });

  it('should return 404 when itemId does not exist', async () => {
    const res = await request(app)
      .delete(`/api/v1/cart/${SESSION}/items/ghost-item`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/cart/:sessionId/coupon
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/cart/:sessionId/coupon', () => {
  beforeEach(async () => {
    await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });
  });

  it('should return 200 with discount applied for a valid coupon', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({ code: 'SAVE50' });

    expect(res.status).toBe(200);
    expect(res.body.coupon).toBe('SAVE50');
    expect(res.body.discount).toBe(50);
    expect(res.body.total).toBe(948);
  });

  // BR-03
  it('[BR-03] should return 400 for an invalid coupon code', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({ code: 'FAKECODE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid|unknown/i);
  });

  // BR-04
  it('[BR-04] should return 400 when a coupon is already applied', async () => {
    await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({ code: 'SAVE50' });

    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({ code: 'SAVE100' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already applied/i);
  });

  it('should return 400 when coupon code is missing from body', async () => {
    const res = await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/v1/cart/:sessionId (clear cart)
// ─────────────────────────────────────────────────────────────
describe('DELETE /api/v1/cart/:sessionId', () => {
  it('should return 200 with an empty cart after clearing', async () => {
    await request(app)
      .post(`/api/v1/cart/${SESSION}/items`)
      .send({ productId: 'p1', name: 'T-Shirt', price: 499, quantity: 2 });

    const res = await request(app).delete(`/api/v1/cart/${SESSION}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });
});
