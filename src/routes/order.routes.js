'use strict';

const express       = require('express');
const orderService  = require('../services/orderService');
const validate      = require('../middleware/validate');
const authenticate  = require('../middleware/authenticate');
const { createOrderSchema } = require('../schemas/order.schemas');

const router = express.Router();

router.use(authenticate);

/**
 * POST /api/v1/orders
 * FR07 — Create an order from the current cart.
 * Body: { sessionId, userId }
 */
router.post('/', validate(createOrderSchema), (req, res, next) => {
  try {
    const order = orderService.createOrder(req.body.sessionId, req.body.userId);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/orders/:orderId
 * FR08 — Return full order detail including item snapshot.
 */
router.get('/:orderId', (req, res, next) => {
  try {
    const order = orderService.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
