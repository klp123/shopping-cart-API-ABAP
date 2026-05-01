'use strict';

const { v4: uuidv4 } = require('uuid');
const { carts }      = require('../data/store');
const { MAX_QTY, COUPONS } = require('../config/constants');

/**
 * Custom application error with HTTP status support.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Retrieve an existing cart or initialise a fresh one.
 * @param {string} sessionId
 * @returns {object} cart
 */
function getOrCreateCart(sessionId) {
  if (!carts.has(sessionId)) {
    carts.set(sessionId, {
      sessionId,
      items:    [],
      coupon:   null,
      discount: 0,
      subtotal: 0,
      total:    0,
    });
  }
  return carts.get(sessionId);
}

/**
 * Recompute subtotal and total on a cart object (mutates in place).
 * @param {object} cart
 * @returns {object} updated cart
 */
function recompute(cart) {
  cart.subtotal = computeSubtotal(cart.items);
  cart.total    = Math.max(0, cart.subtotal - cart.discount);
  return cart;
}

// ── Exported service functions ────────────────────────────────

/**
 * Return a cart by sessionId. Returns an empty cart if not found.
 * FR04
 */
function getCart(sessionId) {
  return getOrCreateCart(sessionId);
}

/**
 * Add a product to the cart. Creates the cart if it does not exist.
 * BR-01 — throws 400 if quantity > MAX_QTY.
 * FR01
 * @param {string} sessionId
 * @param {{ productId: string, name: string, price: number, quantity: number }} item
 */
function addItem(sessionId, { productId, name, price, quantity }) {
  if (quantity > MAX_QTY) {
    throw new AppError(`Quantity exceeds limit of ${MAX_QTY}`, 400);
  }
  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = getOrCreateCart(sessionId);

  // If item already exists, accumulate quantity
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > MAX_QTY) {
      throw new AppError(`Quantity exceeds limit of ${MAX_QTY}`, 400);
    }
    existing.quantity = newQty;
  } else {
    cart.items.push({
      itemId:    uuidv4(),
      productId,
      name,
      price,
      quantity,
    });
  }

  return recompute(cart);
}

/**
 * Update the quantity of an existing cart item.
 * BR-01 — throws 400 if new quantity > MAX_QTY.
 * FR02
 * @param {string} sessionId
 * @param {string} itemId
 * @param {number} quantity
 */
function updateQty(sessionId, itemId, quantity) {
  if (quantity > MAX_QTY) {
    throw new AppError(`Quantity exceeds limit of ${MAX_QTY}`, 400);
  }
  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const cart = getOrCreateCart(sessionId);
  const item = cart.items.find(i => i.itemId === itemId);

  if (!item) {
    throw new AppError('Item not found in cart', 404);
  }

  item.quantity = quantity;
  return recompute(cart);
}

/**
 * Remove an item from the cart.
 * FR03
 * @param {string} sessionId
 * @param {string} itemId
 */
function removeItem(sessionId, itemId) {
  const cart = getOrCreateCart(sessionId);
  const index = cart.items.findIndex(i => i.itemId === itemId);

  if (index === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(index, 1);
  return recompute(cart);
}

/**
 * Apply a fixed-discount coupon to the cart.
 * BR-03 — throws 400 for unknown coupon codes.
 * BR-04 — throws 400 if a coupon is already applied.
 * FR05
 * @param {string} sessionId
 * @param {string} code
 */
function applyCoupon(sessionId, code) {
  const cart = getOrCreateCart(sessionId);

  if (cart.coupon) {
    throw new AppError('Coupon already applied', 400);
  }

  const upperCode = code.toUpperCase();
  const discountValue = COUPONS[upperCode];

  if (!discountValue) {
    throw new AppError('Invalid or unknown coupon code', 400);
  }

  cart.coupon   = upperCode;
  cart.discount = discountValue;
  return recompute(cart);
}

/**
 * Clear all items and reset coupon/discount from a cart.
 * Used internally after order placement.
 * @param {string} sessionId
 */
function clearCart(sessionId) {
  const cart = getOrCreateCart(sessionId);
  cart.items    = [];
  cart.coupon   = null;
  cart.discount = 0;
  return recompute(cart);
}

/**
 * Compute the sum of (price × quantity) across all items.
 * Pure function — used by recompute() and directly in tests.
 * @param {Array} items
 * @returns {number} subtotal
 */
function computeSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

module.exports = {
  getCart,
  addItem,
  updateQty,
  removeItem,
  applyCoupon,
  clearCart,
  computeSubtotal,
  AppError,
};
