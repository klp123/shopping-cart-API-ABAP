'use strict';

const express    = require('express');
const cartService = require('../services/cartService');
const validate      = require('../middleware/validate');
const authenticate  = require('../middleware/authenticate');
const {
  addItemSchema,
  updateQtySchema,
  applyCouponSchema,
} = require('../schemas/cart.schemas');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/v1/cart/:sessionId
 * FR04 — Return cart with line items and computed subtotal/total.
 */
router.get('/:sessionId', (req, res, next) => {
  try {
    const cart = cartService.getCart(req.params.sessionId);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cart/:sessionId/items
 * FR01 — Add a product to the cart.
 * Body: { productId, name, price, quantity }
 */
router.post('/:sessionId/items', validate(addItemSchema), (req, res, next) => {
  try {
    const cart = cartService.addItem(req.params.sessionId, req.body);
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/cart/:sessionId/items/:itemId
 * FR02 — Update quantity of a cart item.
 * Body: { quantity }
 */
router.put('/:sessionId/items/:itemId', validate(updateQtySchema), (req, res, next) => {
  try {
    const cart = cartService.updateQty(
      req.params.sessionId,
      req.params.itemId,
      req.body.quantity,
    );
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/cart/:sessionId/items/:itemId
 * FR03 — Remove an item from the cart.
 */
router.delete('/:sessionId/items/:itemId', (req, res, next) => {
  try {
    const cart = cartService.removeItem(req.params.sessionId, req.params.itemId);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/cart/:sessionId/coupon
 * FR05 — Apply a fixed-discount coupon code.
 * Body: { code }
 */
router.post('/:sessionId/coupon', validate(applyCouponSchema), (req, res, next) => {
  try {
    const cart = cartService.applyCoupon(req.params.sessionId, req.body.code);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/cart/:sessionId
 * Clear all items from a cart session.
 */
router.delete('/:sessionId', (req, res, next) => {
  try {
    const cart = cartService.clearCart(req.params.sessionId);
    res.status(200).json(cart);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
