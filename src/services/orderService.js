'use strict';

const { v4: uuidv4 } = require('uuid');
const { orders }     = require('../data/store');
const { carts }      = require('../data/store');
const cartService    = require('./cartService');
const { AppError }   = require('./cartService');

/**
 * Create an order from the current state of a cart.
 *
 * BR-02 — throws 422 if the cart is empty.
 * BR-05 — snapshots product name and price at the time of placement;
 *          the stored order never reflects future price changes.
 *
 * FR07
 * @param {string} sessionId
 * @param {string} userId
 * @returns {object} order
 */
function createOrder(sessionId, userId) {
  const cart = cartService.getCart(sessionId);

  // BR-02 — reject empty cart
  if (!cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty. Add items before placing an order.', 422);
  }

  // BR-05 — deep-copy items to snapshot name + price at this moment
  const itemSnapshot = cart.items.map(item => ({
    productId: item.productId,
    name:      item.name,
    price:     item.price,       // price locked at order time
    quantity:  item.quantity,
    lineTotal: item.price * item.quantity,
  }));

  const order = {
    orderId:   uuidv4(),
    userId,
    sessionId,
    items:     itemSnapshot,
    subtotal:  cart.subtotal,
    discount:  cart.discount,
    coupon:    cart.coupon,
    total:     cart.total,
    status:    'PLACED',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  // Clear cart after successful order placement
  cartService.clearCart(sessionId);

  return order;
}

/**
 * Retrieve a full order by its ID.
 * Returns null if no order with that ID exists.
 * FR08
 * @param {string} orderId
 * @returns {object|null}
 */
function getOrderById(orderId) {
  return orders.find(o => o.orderId === orderId) || null;
}

module.exports = { createOrder, getOrderById };
