'use strict';

const express = require('express');
const productService = require('../services/odataService');

const router = express.Router();

/**
 * GET /api/v1/products
 * Fetch products from OData (SAP)
 * Query: ?minPrice=100&limit=5
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('hiiiiii')
    const products = await productService.fetchProductsFromOData(req.query);
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
