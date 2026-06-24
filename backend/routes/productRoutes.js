const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const adminOnly = [protect, authorizeRoles('admin')];

router.get('/',         getProducts);                      // public — shop page
router.post('/',        ...adminOnly, createProduct);
router.put('/:id',      ...adminOnly, updateProduct);
router.delete('/:id',   ...adminOnly, deleteProduct);

module.exports = router;
