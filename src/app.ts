import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';
import { productStore } from './models/productStore';
import { generateAllProducts } from './data/seedData';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    productCount: productStore.count(),
  });
});

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'E-Commerce Search Engine API',
    version: '1.0.0',
    endpoints: {
      products: {
        'POST /api/v1/product': 'Create a new product',
        'GET /api/v1/product/:id': 'Get product by ID',
        'PUT /api/v1/product/:id': 'Update product',
        'DELETE /api/v1/product/:id': 'Delete product',
        'PUT /api/v1/product/meta-data': 'Update product metadata',
        'GET /api/v1/products': 'Get all products (paginated)',
        'POST /api/v1/products/bulk': 'Bulk create products',
        'GET /api/v1/products/categories': 'Get all categories',
        'GET /api/v1/products/brands': 'Get all brands',
        'GET /api/v1/products/count': 'Get product count',
      },
      search: {
        'GET /api/v1/search/product?query=...': 'Search products',
        'GET /api/v1/search/suggestions?query=...': 'Get search suggestions',
        'GET /api/v1/search/trending': 'Get trending products',
        'GET /api/v1/search/category/:category': 'Get products by category',
      },
    },
    searchFeatures: {
      hinglish: 'Supports Hinglish queries (e.g., "sasta phone", "accha mobile")',
      spellingCorrection: 'Corrects common spelling mistakes (e.g., "ifone" → "iphone")',
      intentDetection: 'Detects price ranges, colors, storage, brands from query',
      ranking: 'Multi-factor ranking based on relevance, rating, popularity, price, stock',
    },
  });
});

// Mount API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Initialize data
export function initializeData(): void {
  console.log('Generating product catalog...');
  const products = generateAllProducts();
  productStore.bulkAdd(products);
  console.log(`Loaded ${productStore.count()} products into catalog`);
}

export default app;
