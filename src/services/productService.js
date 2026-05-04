'use strict';

const products = [
  { id:  1, name: 'Wireless Headphones',       price: 2499, category: 'Electronics' },
  { id:  2, name: 'Running Sneakers',           price: 3299, category: 'Footwear'    },
  { id:  3, name: 'Smart Watch',                price: 7999, category: 'Electronics' },
  { id:  4, name: 'Cotton T-Shirt',             price:  499, category: 'Clothing'    },
  { id:  5, name: 'Yoga Mat',                   price: 1199, category: 'Fitness'     },
  { id:  6, name: 'Stainless Steel Bottle',     price:  699, category: 'Accessories' },
  { id:  7, name: 'Mechanical Keyboard',        price: 4599, category: 'Electronics' },
  { id:  8, name: 'Backpack (30L)',             price: 1899, category: 'Accessories' },
  { id:  9, name: 'Bluetooth Speaker',          price: 3499, category: 'Electronics' },
  { id: 10, name: 'Leather Wallet',             price:  899, category: 'Accessories' },
  { id: 11, name: 'Gaming Mouse',               price: 2199, category: 'Electronics' },
  { id: 12, name: 'Denim Jeans',                price: 1599, category: 'Clothing'    },
  { id: 13, name: 'Resistance Bands Set',       price:  599, category: 'Fitness'     },
  { id: 14, name: 'Sunglasses',                 price: 1299, category: 'Accessories' },
  { id: 15, name: 'USB-C Hub',                  price: 1799, category: 'Electronics' },
  { id: 16, name: 'Trail Running Shoes',        price: 4299, category: 'Footwear'    },
  { id: 17, name: 'Hooded Sweatshirt',          price:  999, category: 'Clothing'    },
  { id: 18, name: 'Foam Roller',                price:  849, category: 'Fitness'     },
  { id: 19, name: 'Noise-Cancelling Earbuds',   price: 5999, category: 'Electronics' },
  { id: 20, name: 'Canvas Tote Bag',            price:  399, category: 'Accessories' },
  { id: 21, name: 'Smart LED Bulb',             price:  749, category: 'Electronics' },
  { id: 22, name: 'Formal Oxford Shoes',        price: 3799, category: 'Footwear'    },
  { id: 23, name: 'Polo T-Shirt',               price:  649, category: 'Clothing'    },
  { id: 24, name: 'Adjustable Dumbbells',       price: 6499, category: 'Fitness'     },
  { id: 25, name: 'Laptop Stand',               price: 1349, category: 'Accessories' },
  { id: 26, name: 'Webcam 1080p',               price: 2899, category: 'Electronics' },
  { id: 27, name: 'Slip-On Loafers',            price: 1999, category: 'Footwear'    },
  { id: 28, name: 'Linen Shorts',               price:  799, category: 'Clothing'    },
  { id: 29, name: 'Jump Rope',                  price:  349, category: 'Fitness'     },
  { id: 30, name: 'Portable Charger 20000mAh',  price: 2199, category: 'Electronics' },
];

function getProducts({ category, minPrice, maxPrice, limit, skip } = {}) {
  let result = [...products];

  if (category) {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (minPrice !== undefined) {
    result = result.filter(p => p.price > Number(minPrice));
  }
  if (maxPrice !== undefined) {
    result = result.filter(p => p.price < Number(maxPrice));
  }

  const count = result.length;

  if (skip !== undefined) {
    result = result.slice(Number(skip));
  }
  if (limit !== undefined) {
    result = result.slice(0, Number(limit));
  }

  return { count, products: result };
}

module.exports = { getProducts };

