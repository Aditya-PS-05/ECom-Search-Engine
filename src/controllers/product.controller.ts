import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { purchaseHistoryStore } from '../models/purchaseHistory';
import { CreateProductRequest, UpdateMetadataRequest } from '../types';

export class ProductController {
  
  // POST /api/v1/product
  createProduct(req: Request, res: Response): void {
    try {
      const productRequest: CreateProductRequest = req.body;
      
      // Validation
      if (!productRequest.title || !productRequest.description) {
        res.status(400).json({
          success: false,
          error: 'Title and description are required',
        });
        return;
      }
      
      if (productRequest.price === undefined || productRequest.mrp === undefined) {
        res.status(400).json({
          success: false,
          error: 'Price and MRP are required',
        });
        return;
      }
      
      if (productRequest.stock === undefined) {
        res.status(400).json({
          success: false,
          error: 'Stock is required',
        });
        return;
      }
      
      const result = productService.createProduct(productRequest);
      
      if (result.success) {
        res.status(201).json(result.data);
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/product/:id
  getProduct(req: Request, res: Response): void {
    try {
      const productId = parseInt(req.params.id as string);
      
      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID',
        });
        return;
      }
      
      const result = productService.getProduct(productId);
      
      if (result.success) {
        res.status(200).json(result.data);
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // PUT /api/v1/product/:id
  updateProduct(req: Request, res: Response): void {
    try {
      const productId = parseInt(req.params.id as string);
      
      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID',
        });
        return;
      }
      
      const result = productService.updateProduct(productId, req.body);
      
      if (result.success) {
        res.status(200).json(result.data);
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // PUT /api/v1/product/meta-data
  updateMetadata(req: Request, res: Response): void {
    try {
      const { productId, Metadata }: UpdateMetadataRequest = req.body;
      
      if (!productId || !Metadata) {
        res.status(400).json({
          success: false,
          error: 'productId and Metadata are required',
        });
        return;
      }
      
      const result = productService.updateMetadata(productId, Metadata);
      
      if (result.success) {
        res.status(200).json(result.data);
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // DELETE /api/v1/product/:id
  deleteProduct(req: Request, res: Response): void {
    try {
      const productId = parseInt(req.params.id as string);
      
      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid product ID',
        });
        return;
      }
      
      const result = productService.deleteProduct(productId);
      
      if (result.success) {
        res.status(200).json({ success: true, message: result.message });
      } else {
        res.status(404).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/products
  getAllProducts(req: Request, res: Response): void {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = productService.getAllProducts(page, limit);
      
      if (result.success) {
        res.status(200).json(result.data);
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // POST /api/v1/products/bulk
  bulkCreateProducts(req: Request, res: Response): void {
    try {
      const products: CreateProductRequest[] = req.body.products;
      
      if (!products || !Array.isArray(products)) {
        res.status(400).json({
          success: false,
          error: 'Products array is required',
        });
        return;
      }
      
      const result = productService.bulkCreateProducts(products);
      
      if (result.success) {
        res.status(201).json(result.data);
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/products/categories
  getCategories(req: Request, res: Response): void {
    try {
      const categories = productService.getCategories();
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/products/brands
  getBrands(req: Request, res: Response): void {
    try {
      const brands = productService.getBrands();
      res.status(200).json({ brands });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/products/count
  getProductCount(req: Request, res: Response): void {
    try {
      const count = productService.getProductCount();
      res.status(200).json({ count });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // POST /api/v1/purchase - Record a purchase for repeat purchase feature
  recordPurchase(req: Request, res: Response): void {
    try {
      const { userId, productId } = req.body;

      if (!userId || !productId) {
        res.status(400).json({
          success: false,
          error: 'userId and productId are required',
        });
        return;
      }

      purchaseHistoryStore.addPurchase(userId, productId);

      res.status(201).json({
        success: true,
        message: 'Purchase recorded successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/purchases/:userId - Get user's purchase history
  getUserPurchases(req: Request, res: Response): void {
    try {
      const userId = req.params.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required',
        });
        return;
      }

      const purchases = purchaseHistoryStore.getUserPurchases(userId as string);

      res.status(200).json({
        success: true,
        data: purchases,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}

export const productController = new ProductController();
