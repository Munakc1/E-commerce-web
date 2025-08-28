const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');

// GET /products - Get all products
router.get('/', productController.getAllProducts);

// GET /products/:id - Get single product
router.get('/:id', productController.getProduct);

// POST /products - Create new product
router.post('/', upload.array('images', 5), productController.createProduct);

// PUT /products/:id - Update product
router.put('/:id', upload.array('images', 5), productController.updateProduct);

// DELETE /products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;