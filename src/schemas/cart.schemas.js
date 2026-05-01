'use strict';

const { z } = require('zod');
const { MAX_QTY } = require('../config/constants');

const addItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  name:      z.string().min(1, 'name is required'),
  price:     z.number().positive('price must be a positive number'),
  quantity:  z.number().int().min(1).max(MAX_QTY, `quantity cannot exceed ${MAX_QTY}`),
});

const updateQtySchema = z.object({
  quantity: z.number().int().min(1).max(MAX_QTY, `quantity cannot exceed ${MAX_QTY}`),
});

const applyCouponSchema = z.object({
  code: z.string().min(1, 'coupon code is required'),
});

module.exports = { addItemSchema, updateQtySchema, applyCouponSchema };
