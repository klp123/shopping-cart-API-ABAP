'use strict';

/**
 * Business rule BR-01 — Maximum quantity allowed per cart line item.
 */
const MAX_QTY = 10;

/**
 * Supported coupon codes (fixed-discount only — business rule BR-03).
 * Key: coupon code (uppercase), Value: discount amount in Rs.
 */
const COUPONS = {
  SAVE50:  50,
  SAVE100: 100,
  SAVE200: 200,
};

module.exports = { MAX_QTY, COUPONS };
