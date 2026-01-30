import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { SearchQuery } from '../types';

export class SearchController {
  
  // GET /api/v1/search/product
  searchProducts(req: Request, res: Response): void {
    try {
      const startTime = Date.now();
      
      // Parse query parameters
      const searchQuery: SearchQuery = {
        query: (req.query.query as string) || '',
        category: req.query.category as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        brand: req.query.brand as string,
        minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
        inStock: req.query.inStock === 'true',
        sortBy: req.query.sortBy as SearchQuery['sortBy'],
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };
      
      // Validate query
      if (!searchQuery.query || searchQuery.query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }
      
      // Perform search
      const { results, total, queryInfo } = searchService.search(searchQuery);
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Response format matching the spec
      res.status(200).json({
        data: results,
        pagination: {
          page: searchQuery.page,
          limit: searchQuery.limit,
          total,
          totalPages: Math.ceil(total / (searchQuery.limit || 20)),
        },
        queryInfo: {
          originalQuery: queryInfo.originalQuery,
          processedQuery: queryInfo.processedQuery,
          intents: queryInfo.intents,
        },
        latencyMs: latency,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/search/suggestions
  getSuggestions(req: Request, res: Response): void {
    try {
      const query = (req.query.query as string) || '';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.trim().length < 2) {
        res.status(200).json({ suggestions: [] });
        return;
      }
      
      const suggestions = searchService.getSuggestions(query, limit);
      
      res.status(200).json({ suggestions });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/search/trending
  getTrending(req: Request, res: Response): void {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const trending = searchService.getTrending(limit);
      
      res.status(200).json({ data: trending });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get trending: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  // GET /api/v1/search/category/:category
  getByCategory(req: Request, res: Response): void {
    try {
      const category = req.params.category as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      if (!category) {
        res.status(400).json({
          success: false,
          error: 'Category is required',
        });
        return;
      }
      
      const products = searchService.getByCategory(category, limit);
      
      res.status(200).json({ data: products });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get category products: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}

export const searchController = new SearchController();
