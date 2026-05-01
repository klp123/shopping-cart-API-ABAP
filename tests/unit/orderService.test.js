'use strict';

/**
 * Unit Tests — OrderService
 *
 * TDD Coverage:
 *   BR-02  Reject order if cart is empty (422)
 *   BR-05  Order snapshots product name + price at placement time
 *
 * Run: npm run test:unit
 */

const { resetStore }  = require('../../src/data/store');
const cartService     = require('../../src/services/cartService');
const orderService    = require('../../src/services/orderService');

const SESSION  = 'order-test-session';
const USER_ID  = 'user-001';
const PRODUCT  = { productId: 'prod-001', name: 'Wireless Headphones', price: 2499, quantity: 1 };
const PRODUCT2 = { productId: 'prod-002', name: 'Phone Case',           price: 299,  quantity: 3 };

beforeEach(() => {
  resetStore();
});

// ─────────────────────────────────────────────────────────────
// createOrder
// ─────────────────────────────────────────────────────────────
describe('createOrder', () => {
  it('should create an order from a non-empty cart and return orderId', () => {
    cartService.addItem(SESSION, PRODUCT);

    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.orderId).toBeDefined();
    expect(typeof order.orderId).toBe('string');
    expect(order.userId).toBe(USER_ID);
    expect(order.sessionId).toBe(SESSION);
    expect(order.status).toBe('PLACED');
  });

  it('should include all cart items in the order', () => {
    cartService.addItem(SESSION, PRODUCT);
    cartService.addItem(SESSION, PRODUCT2);

    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.items).toHaveLength(2);
  });

  it('should compute correct total from cart at time of placement', () => {
    cartService.addItem(SESSION, PRODUCT);  // 2499 * 1 = 2499
    cartService.addItem(SESSION, PRODUCT2); // 299  * 3 = 897

    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.subtotal).toBe(3396);
    expect(order.total).toBe(3396);
  });

  it('should apply coupon discount to the order total', () => {
    cartService.addItem(SESSION, PRODUCT);     // 2499
    cartService.applyCoupon(SESSION, 'SAVE50');

    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.discount).toBe(50);
    expect(order.total).toBe(2449);
    expect(order.coupon).toBe('SAVE50');
  });

  it('should set a createdAt ISO timestamp on the order', () => {
    cartService.addItem(SESSION, PRODUCT);
    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.createdAt).toBeDefined();
    expect(() => new Date(order.createdAt)).not.toThrow();
  });

  it('should clear the cart after successful order placement', () => {
    cartService.addItem(SESSION, PRODUCT);
    orderService.createOrder(SESSION, USER_ID);

    const cart = cartService.getCart(SESSION);
    expect(cart.items).toHaveLength(0);
  });

  // BR-02
  it('[BR-02] should throw 422 when cart is empty', () => {
    expect(() =>
      orderService.createOrder(SESSION, USER_ID)
    ).toThrow('Cart is empty');
  });

  it('[BR-02] should throw AppError with statusCode 422 for empty cart', () => {
    try {
      orderService.createOrder(SESSION, USER_ID);
    } catch (err) {
      expect(err.statusCode).toBe(422);
      expect(err.name).toBe('AppError');
    }
  });

  it('[BR-02] should throw 422 after cart has been cleared', () => {
    cartService.addItem(SESSION, PRODUCT);
    cartService.clearCart(SESSION);

    expect(() =>
      orderService.createOrder(SESSION, USER_ID)
    ).toThrow('Cart is empty');
  });

  // BR-05 — price snapshot
  it('[BR-05] should snapshot product name and price at time of placement', () => {
    cartService.addItem(SESSION, PRODUCT); // price = 2499

    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.items[0].name).toBe('Wireless Headphones');
    expect(order.items[0].price).toBe(2499);
    expect(order.items[0].quantity).toBe(1);
    expect(order.items[0].lineTotal).toBe(2499);
  });

  it('[BR-05] order item price must not change when product price changes after placement', () => {
    cartService.addItem(SESSION, { ...PRODUCT, price: 2499 });
    const order = orderService.createOrder(SESSION, USER_ID);

    // Simulate a price change in a future cart (different session)
    cartService.addItem('new-session', { ...PRODUCT, price: 3999 });

    // Original order retains snapshot price
    expect(order.items[0].price).toBe(2499);
  });

  it('[BR-05] should include lineTotal (price * quantity) for each item', () => {
    cartService.addItem(SESSION, PRODUCT2); // 299 * 3 = 897
    const order = orderService.createOrder(SESSION, USER_ID);

    expect(order.items[0].lineTotal).toBe(897);
  });
});

// ─────────────────────────────────────────────────────────────
// getOrderById
// ─────────────────────────────────────────────────────────────
describe('getOrderById', () => {
  it('should return the full order detail for a valid orderId', () => {
    cartService.addItem(SESSION, PRODUCT);
    const placed = orderService.createOrder(SESSION, USER_ID);

    const found = orderService.getOrderById(placed.orderId);

    expect(found).not.toBeNull();
    expect(found.orderId).toBe(placed.orderId);
    expect(found.items).toHaveLength(1);
  });

  it('should return null for an unknown orderId', () => {
    const found = orderService.getOrderById('non-existent-order-id');
    expect(found).toBeNull();
  });

  it('should return null for an empty string orderId', () => {
    const found = orderService.getOrderById('');
    expect(found).toBeNull();
  });
});
