import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

// Metadata update (as per spec) - MUST be before :id routes
router.put('/product/meta-data', (req, res) => productController.updateMetadata(req, res));

// Product CRUD operations
router.post('/product', (req, res) => productController.createProduct(req, res));
router.get('/product/:id', (req, res) => productController.getProduct(req, res));
router.put('/product/:id', (req, res) => productController.updateProduct(req, res));
router.delete('/product/:id', (req, res) => productController.deleteProduct(req, res));

// Bulk and listing operations
router.get('/products', (req, res) => productController.getAllProducts(req, res));
router.post('/products/bulk', (req, res) => productController.bulkCreateProducts(req, res));

// Utility endpoints
router.get('/products/categories', (req, res) => productController.getCategories(req, res));
router.get('/products/brands', (req, res) => productController.getBrands(req, res));
router.get('/products/count', (req, res) => productController.getProductCount(req, res));

export default router;
