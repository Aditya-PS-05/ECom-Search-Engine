import { Router } from 'express';
import productRoutes from './product.routes';
import searchRoutes from './search.routes';

const router = Router();

// Mount routes
router.use(productRoutes);
router.use(searchRoutes);

export default router;
