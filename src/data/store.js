'use strict';

/**
 * In-memory data store — replaces Redis / DB for POC scope.
 *
 * carts  — Map<sessionId, CartObject>
 * orders — Array<OrderObject>
 *
 * Cart shape:
 * {
 *   sessionId : string,
 *   items     : [{ itemId, productId, name, price, quantity }],
 *   coupon    : string | null,
 *   discount  : number,
 *   subtotal  : number,
 *   total     : number
 * }
 *
 * Order shape:
 * {
 *   orderId   : string,
 *   userId    : string,
 *   sessionId : string,
 *   items     : [{ productId, name, price, quantity }],  // price snapshot
 *   subtotal  : number,
 *   discount  : number,
 *   total     : number,
 *   createdAt : string (ISO)
 * }
 */

const carts  = new Map();
const orders = [];

/**
 * Reset store — used in tests to ensure clean state between runs.
 */
function resetStore() {
  carts.clear();
  orders.length = 0;
}

module.exports = { carts, orders, resetStore };
