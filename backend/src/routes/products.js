const express = require('express');
const router = express.Router();
const { authenticate, requireOrganization } = require('../middlewares/auth');
const {
  getProducts, getProduct, getCategories, createProduct, updateProduct, deleteProduct
} = require('../controllers/productController');

router.use(authenticate);
router.use(requireOrganization);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
