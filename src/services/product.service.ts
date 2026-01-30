import { Product, CreateProductRequest, ProductMetadata, ApiResponse } from '../types';
import { productStore } from '../models/productStore';

export class ProductService {
  
  // Create a new product
  createProduct(request: CreateProductRequest): ApiResponse<{ productId: number }> {
    try {
      const product = productStore.add(request);
      if (!product) {
        return {
          success: false,
          error: 'Duplicate product: a product with similar title already exists',
        };
      }
      return {
        success: true,
        data: { productId: product.productId },
        message: 'Product created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Get product by ID
  getProduct(productId: number): ApiResponse<Product> {
    try {
      const product = productStore.get(productId);
      
      if (!product) {
        return {
          success: false,
          error: `Product with ID ${productId} not found`,
        };
      }
      
      return {
        success: true,
        data: product,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Update product
  updateProduct(productId: number, updates: Partial<CreateProductRequest>): ApiResponse<Product> {
    try {
      const existing = productStore.get(productId);
      
      if (!existing) {
        return {
          success: false,
          error: `Product with ID ${productId} not found`,
        };
      }
      
      const updated = productStore.update(productId, updates);
      
      return {
        success: true,
        data: updated!,
        message: 'Product updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Update product metadata
  updateMetadata(productId: number, metadata: ProductMetadata): ApiResponse<{ productId: number; Metadata: ProductMetadata }> {
    try {
      const existing = productStore.get(productId);
      
      if (!existing) {
        return {
          success: false,
          error: `Product with ID ${productId} not found`,
        };
      }
      
      const updated = productStore.updateMetadata(productId, metadata);
      
      return {
        success: true,
        data: {
          productId: updated!.productId,
          Metadata: updated!.metadata,
        },
        message: 'Metadata updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Delete product
  deleteProduct(productId: number): ApiResponse<void> {
    try {
      const deleted = productStore.delete(productId);
      
      if (!deleted) {
        return {
          success: false,
          error: `Product with ID ${productId} not found`,
        };
      }
      
      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Get all products with pagination
  getAllProducts(page: number = 1, limit: number = 20): ApiResponse<{ products: Product[]; total: number; page: number; totalPages: number }> {
    try {
      const allProducts = productStore.getAll();
      const total = allProducts.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const products = allProducts.slice(start, start + limit);
      
      return {
        success: true,
        data: {
          products,
          total,
          page,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Bulk create products
  bulkCreateProducts(requests: CreateProductRequest[]): ApiResponse<{ created: number; productIds: number[] }> {
    try {
      const products = productStore.bulkAdd(requests);
      const productIds = products.map(p => p.productId);
      
      return {
        success: true,
        data: {
          created: products.length,
          productIds,
        },
        message: `Successfully created ${products.length} products`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to bulk create products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Get product count
  getProductCount(): number {
    return productStore.count();
  }

  // Get categories
  getCategories(): string[] {
    const products = productStore.getAll();
    const categories = new Set<string>();
    
    products.forEach(p => {
      if (p.metadata.category) {
        categories.add(p.metadata.category);
      }
    });
    
    return Array.from(categories);
  }

  // Get brands
  getBrands(): string[] {
    const products = productStore.getAll();
    const brands = new Set<string>();
    
    products.forEach(p => {
      if (p.metadata.brand) {
        brands.add(p.metadata.brand);
      }
    });
    
    return Array.from(brands).sort();
  }
}

export const productService = new ProductService();
