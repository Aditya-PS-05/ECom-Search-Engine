import { Router } from 'express';
import { searchController } from '../controllers/search.controller';

const router = Router();

// Main search endpoint (as per spec)
router.get('/search/product', (req, res) => searchController.searchProducts(req, res));

// Additional search endpoints
router.get('/search/suggestions', (req, res) => searchController.getSuggestions(req, res));
router.get('/search/trending', (req, res) => searchController.getTrending(req, res));
router.get('/search/category/:category', (req, res) => searchController.getByCategory(req, res));

export default router;
