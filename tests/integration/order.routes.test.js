'use strict';

/**
 * Integration Tests — Order Routes
 * Uses Supertest to fire real HTTP requests against the Express app.
 *
 * Run: npm run test:integration
 */

const request        = require('supertest');
const app            = require('../../src/app');
const { resetStore } = require('../../src/data/store');

const SESSION = 'order-integration-session';
const USER_ID = 'user-001';

const PRODUCT = { productId: 'p1', name: 'Wireless Headphones', price: 2499, quantity: 1 };

async function seedCart(session = SESSION) {
  return request(app)
    .post(`/api/v1/cart/${session}/items`)
    .send(PRODUCT);
}

beforeEach(() => {
  resetStore();
});

afterAll(() => {
  resetStore();
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/orders
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/orders', () => {
  it('should return 201 with the created order for a non-empty cart', async () => {
    await seedCart();

    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.userId).toBe(USER_ID);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.status).toBe('PLACED');
  });

  it('should include item snapshot with name, price, and quantity', async () => {
    await seedCart();

    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    expect(res.body.items[0].name).toBe('Wireless Headphones');
    expect(res.body.items[0].price).toBe(2499);
    expect(res.body.items[0].lineTotal).toBe(2499);
  });

  it('should apply coupon discount to the order total', async () => {
    await seedCart();
    await request(app)
      .post(`/api/v1/cart/${SESSION}/coupon`)
      .send({ code: 'SAVE50' });

    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    expect(res.body.discount).toBe(50);
    expect(res.body.total).toBe(2449);
  });

  it('should clear the cart after order is placed', async () => {
    await seedCart();
    await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    const cartRes = await request(app).get(`/api/v1/cart/${SESSION}`);
    expect(cartRes.body.items).toHaveLength(0);
  });

  // BR-02
  it('[BR-02] should return 422 when cart is empty', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  it('[BR-02] should return 422 after cart has been cleared', async () => {
    await seedCart();
    await request(app).delete(`/api/v1/cart/${SESSION}`);

    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    expect(res.status).toBe(422);
  });

  it('should return 400 when sessionId is missing from body', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ userId: USER_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 when userId is missing from body', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/orders/:orderId
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/orders/:orderId', () => {
  it('should return 200 with full order detail for a valid orderId', async () => {
    await seedCart();
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .send({ sessionId: SESSION, userId: USER_ID });

    const orderId = orderRes.body.orderId;
    const res = await request(app).get(`/api/v1/orders/${orderId}`);

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(orderId);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.createdAt).toBeDefined();
  });

  it('should return 404 for an unknown orderId', async () => {
    const res = await request(app).get('/api/v1/orders/non-existent-order-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });
});

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('should return 200 with status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
