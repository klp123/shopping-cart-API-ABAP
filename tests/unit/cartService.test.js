'use strict';

/**
 * Unit Tests — CartService
 *
 * TDD Coverage:
 *   BR-01  Max 10 units per cart line item
 *   BR-03  Fixed-discount coupon codes only
 *   BR-04  Coupon applied once per session
 *
 * Run: npm run test:unit //
 */

const { resetStore } = require('../../src/data/store');
const cartService    = require('../../src/services/cartService');

// ── Test data ─────────────────────────────────────────────────
const SESSION = 'test-session-001';
const PRODUCT_A = { productId: 'prod-001', name: 'Blue T-Shirt', price: 499, quantity: 2 };
const PRODUCT_B = { productId: 'prod-002', name: 'Black Jeans',  price: 999, quantity: 1 };

beforeEach(() => {
  resetStore();
});

// ─────────────────────────────────────────────────────────────
// getCart
// ─────────────────────────────────────────────────────────────
describe('getCart', () => {
  it('should return an empty cart for a new sessionId', () => {
    const cart = cartService.getCart(SESSION);
    expect(cart.sessionId).toBe(SESSION);
    expect(cart.items).toEqual([]);
    expect(cart.subtotal).toBe(0);
    expect(cart.total).toBe(0);
    expect(cart.discount).toBe(0);
    expect(cart.coupon).toBeNull();
  });

  it('should return the same cart on repeated calls for the same sessionId', () => {
    cartService.addItem(SESSION, PRODUCT_A);
    const cart1 = cartService.getCart(SESSION);
    const cart2 = cartService.getCart(SESSION);
    expect(cart1).toBe(cart2);
  });
});

// ─────────────────────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────────────────────
describe('addItem', () => {
  it('should add a product to the cart and return the updated cart', () => {
    const cart = cartService.addItem(SESSION, PRODUCT_A);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe(PRODUCT_A.productId);
    expect(cart.items[0].name).toBe(PRODUCT_A.name);
    expect(cart.items[0].quantity).toBe(PRODUCT_A.quantity);
  });

  it('should generate a unique itemId for each added product', () => {
    const cart = cartService.addItem(SESSION, PRODUCT_A);
    expect(cart.items[0].itemId).toBeDefined();
    expect(typeof cart.items[0].itemId).toBe('string');
  });

  it('should accumulate quantity when same productId is added again', () => {
    cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 3 });
    const cart = cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 4 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(7);
  });

  it('should compute correct subtotal after adding items', () => {
    cartService.addItem(SESSION, PRODUCT_A); // 499 * 2 = 998
    const cart = cartService.addItem(SESSION, PRODUCT_B); // + 999 * 1 = 999
    expect(cart.subtotal).toBe(1997);
    expect(cart.total).toBe(1997);
  });

  // BR-01
  it('[BR-01] should throw 400 when quantity exceeds MAX_QTY (10)', () => {
    expect(() =>
      cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 11 })
    ).toThrow('Quantity exceeds limit of 10');
  });

  it('[BR-01] should throw 400 when accumulated quantity would exceed MAX_QTY', () => {
    cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 8 });
    expect(() =>
      cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 5 })
    ).toThrow('Quantity exceeds limit of 10');
  });

  it('[BR-01] should throw 400 when quantity is 0 or negative', () => {
    expect(() =>
      cartService.addItem(SESSION, { ...PRODUCT_A, quantity: 0 })
    ).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// updateQty
// ─────────────────────────────────────────────────────────────
describe('updateQty', () => {
  it('should update the quantity of an existing item', () => {
    const added = cartService.addItem(SESSION, PRODUCT_A);
    const itemId = added.items[0].itemId;

    const cart = cartService.updateQty(SESSION, itemId, 5);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.subtotal).toBe(499 * 5);
  });

  it('should recompute subtotal and total after quantity update', () => {
    const added = cartService.addItem(SESSION, PRODUCT_A); // 499 * 2 = 998
    const itemId = added.items[0].itemId;

    const cart = cartService.updateQty(SESSION, itemId, 3); // 499 * 3 = 1497
    expect(cart.subtotal).toBe(1497);
    expect(cart.total).toBe(1497);
  });

  // BR-01
  it('[BR-01] should throw 400 when updated quantity exceeds MAX_QTY', () => {
    const added = cartService.addItem(SESSION, PRODUCT_A);
    const itemId = added.items[0].itemId;

    expect(() =>
      cartService.updateQty(SESSION, itemId, 11)
    ).toThrow('Quantity exceeds limit of 10');
  });

  it('should throw 404 when itemId does not exist', () => {
    expect(() =>
      cartService.updateQty(SESSION, 'non-existent-id', 2)
    ).toThrow('Item not found in cart');
  });
});

// ─────────────────────────────────────────────────────────────
// removeItem
// ─────────────────────────────────────────────────────────────
describe('removeItem', () => {
  it('should remove an item from the cart', () => {
    const added = cartService.addItem(SESSION, PRODUCT_A);
    const itemId = added.items[0].itemId;

    const cart = cartService.removeItem(SESSION, itemId);
    expect(cart.items).toHaveLength(0);
    expect(cart.subtotal).toBe(0);
  });

  it('should recompute subtotal after removing one of multiple items', () => {
    const added = cartService.addItem(SESSION, PRODUCT_A); // 499*2 = 998
    const itemId = added.items[0].itemId;
    cartService.addItem(SESSION, PRODUCT_B); // 999*1 = 999

    const cart = cartService.removeItem(SESSION, itemId);
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotal).toBe(999);
  });

  it('should throw 404 when itemId does not exist', () => {
    expect(() =>
      cartService.removeItem(SESSION, 'ghost-item-id')
    ).toThrow('Item not found in cart');
  });
});

// ─────────────────────────────────────────────────────────────
// applyCoupon
// ─────────────────────────────────────────────────────────────
describe('applyCoupon', () => {
  beforeEach(() => {
    cartService.addItem(SESSION, PRODUCT_A); // subtotal = 998
  });

  it('should apply a valid fixed-discount coupon and reduce total', () => {
    const cart = cartService.applyCoupon(SESSION, 'SAVE50');
    expect(cart.coupon).toBe('SAVE50');
    expect(cart.discount).toBe(50);
    expect(cart.total).toBe(948); // 998 - 50
  });

  it('should accept coupon codes case-insensitively', () => {
    const cart = cartService.applyCoupon(SESSION, 'save50');
    expect(cart.coupon).toBe('SAVE50');
    expect(cart.discount).toBe(50);
  });

  it('should correctly apply SAVE100 coupon', () => {
    const cart = cartService.applyCoupon(SESSION, 'SAVE100');
    expect(cart.discount).toBe(100);
    expect(cart.total).toBe(898);
  });

  // BR-03
  it('[BR-03] should throw 400 for an unknown coupon code', () => {
    expect(() =>
      cartService.applyCoupon(SESSION, 'INVALID99')
    ).toThrow('Invalid or unknown coupon code');
  });

  it('[BR-03] should throw 400 for an empty coupon code', () => {
    expect(() =>
      cartService.applyCoupon(SESSION, '')
    ).toThrow();
  });

  // BR-04
  it('[BR-04] should throw 400 when coupon is already applied', () => {
    cartService.applyCoupon(SESSION, 'SAVE50');
    expect(() =>
      cartService.applyCoupon(SESSION, 'SAVE100')
    ).toThrow('Coupon already applied');
  });

  it('[BR-04] should throw 400 when same coupon is applied twice', () => {
    cartService.applyCoupon(SESSION, 'SAVE50');
    expect(() =>
      cartService.applyCoupon(SESSION, 'SAVE50')
    ).toThrow('Coupon already applied');
  });
});

// ─────────────────────────────────────────────────────────────
// computeSubtotal
// ─────────────────────────────────────────────────────────────
describe('computeSubtotal', () => {
  it('should return 0 for an empty items array', () => {
    expect(cartService.computeSubtotal([])).toBe(0);
  });

  it('should return price * quantity for a single item', () => {
    expect(cartService.computeSubtotal([{ price: 499, quantity: 2 }])).toBe(998);
  });

  it('should sum across multiple items', () => {
    const items = [
      { price: 499, quantity: 2 },  // 998
      { price: 999, quantity: 1 },  // 999
      { price: 200, quantity: 3 },  // 600
    ];
    expect(cartService.computeSubtotal(items)).toBe(2597);
  });
});

// ─────────────────────────────────────────────────────────────
// clearCart
// ─────────────────────────────────────────────────────────────
describe('clearCart', () => {
  it('should remove all items and reset coupon and discount', () => {
    cartService.addItem(SESSION, PRODUCT_A);
    cartService.applyCoupon(SESSION, 'SAVE50');

    const cart = cartService.clearCart(SESSION);
    expect(cart.items).toHaveLength(0);
    expect(cart.coupon).toBeNull();
    expect(cart.discount).toBe(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.total).toBe(0);
  });
});
