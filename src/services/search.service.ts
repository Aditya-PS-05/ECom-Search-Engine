import { Product, SearchQuery, SearchResult, QueryIntent } from '../types';
import { productStore } from '../models/productStore';
import { queryProcessor } from '../utils/queryProcessor';
import { rankingService } from './ranking.service';

export class SearchService {
  
  // Main search function
  search(searchQuery: SearchQuery): { results: SearchResult[]; total: number; queryInfo: QueryIntent } {
    const startTime = Date.now();
    
    // Step 1: Process the query (Hinglish, spelling, intents)
    const queryIntent = queryProcessor.processQuery(searchQuery.query);
    
    // Step 2: Get all products
    let products = productStore.getAll();
    
    // Step 3: Apply filters
    products = this.applyFilters(products, searchQuery, queryIntent);
    
    // Step 4: Rank products
    const rankedProducts = rankingService.rankProducts(products, queryIntent);
    
    // Step 5: Apply sorting if specified (overrides ranking)
    const sortedProducts = this.applySorting(rankedProducts, searchQuery.sortBy);
    
    // Step 6: Paginate
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const start = (page - 1) * limit;
    const paginatedProducts = sortedProducts.slice(start, start + limit);
    
    // Step 7: Transform to search results
    const results = paginatedProducts.map(product => this.toSearchResult(product));
    
    const endTime = Date.now();
    console.log(`Search completed in ${endTime - startTime}ms for query: "${searchQuery.query}"`);
    
    return {
      results,
      total: sortedProducts.length,
      queryInfo: queryIntent,
    };
  }

  // Apply filters based on search query and intents
  private applyFilters(products: Product[], searchQuery: SearchQuery, queryIntent: QueryIntent): Product[] {
    let filtered = products;
    
    // Category filter
    const category = searchQuery.category || queryIntent.intents.category;
    if (category) {
      filtered = filtered.filter(p => 
        p.metadata.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Brand filter - only apply if explicitly set in search params, otherwise use for ranking boost
    if (searchQuery.brand) {
      filtered = filtered.filter(p => 
        p.metadata.brand?.toLowerCase() === searchQuery.brand!.toLowerCase()
      );
    }
    // Note: queryIntent.intents.brand is used for ranking boost, not filtering
    
    // Price range filter
    const priceRange = queryIntent.intents.priceRange;
    if (searchQuery.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= searchQuery.minPrice!);
    } else if (priceRange?.min !== undefined) {
      filtered = filtered.filter(p => p.price >= priceRange.min!);
    }
    
    if (searchQuery.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= searchQuery.maxPrice!);
    } else if (priceRange?.max !== undefined) {
      filtered = filtered.filter(p => p.price <= priceRange.max!);
    }
    
    // Rating filter
    if (searchQuery.minRating !== undefined) {
      filtered = filtered.filter(p => p.rating >= searchQuery.minRating!);
    }
    
    // Stock filter
    if (searchQuery.inStock === true) {
      filtered = filtered.filter(p => p.stock > 0);
    }
    
    // Color filter from intent
    if (queryIntent.intents.color) {
      // Don't strictly filter, but this will be used in ranking boost
      // Only filter if explicitly searching for a color
      const colorInQuery = queryIntent.processedQuery.includes(queryIntent.intents.color);
      if (colorInQuery) {
        // Soft filter: prioritize matching colors but include others
        const colorMatches = filtered.filter(p => 
          p.metadata.color?.toLowerCase() === queryIntent.intents.color?.toLowerCase() ||
          p.title.toLowerCase().includes(queryIntent.intents.color!)
        );
        const nonMatches = filtered.filter(p => 
          p.metadata.color?.toLowerCase() !== queryIntent.intents.color?.toLowerCase() &&
          !p.title.toLowerCase().includes(queryIntent.intents.color!)
        );
        filtered = [...colorMatches, ...nonMatches];
      }
    }
    
    return filtered;
  }

  // Apply explicit sorting (overrides relevance ranking)
  private applySorting(products: Product[], sortBy?: string): Product[] {
    if (!sortBy || sortBy === 'relevance') {
      return products; // Already sorted by relevance
    }
    
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => {
          // Sort by rating, then by rating count for tie-breaking
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.ratingCount - a.ratingCount;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popularity':
        sorted.sort((a, b) => b.unitsSold - a.unitsSold);
        break;
      case 'discount':
        sorted.sort((a, b) => {
          const discountA = (a.mrp - a.price) / a.mrp;
          const discountB = (b.mrp - b.price) / b.mrp;
          return discountB - discountA;
        });
        break;
    }
    
    return sorted;
  }

  // Transform Product to SearchResult
  private toSearchResult(product: Product): SearchResult {
    return {
      productId: product.productId,
      title: product.title,
      description: product.description,
      mrp: product.mrp,
      Sellingprice: product.price,
      Metadata: product.metadata,
      stock: product.stock,
      rating: product.rating,
      ratingCount: product.ratingCount,
    };
  }

  // Get search suggestions based on partial query
  getSuggestions(partialQuery: string, limit: number = 10): string[] {
    const queryIntent = queryProcessor.processQuery(partialQuery);
    const products = productStore.getAll();
    
    const suggestions = new Set<string>();
    
    // Add matching product titles
    for (const product of products) {
      if (product.title.toLowerCase().includes(queryIntent.processedQuery)) {
        suggestions.add(product.title);
      }
      if (suggestions.size >= limit * 2) break;
    }
    
    // Add matching brands
    const brands = new Set(products.map(p => p.metadata.brand).filter(Boolean));
    for (const brand of brands) {
      if (brand?.toLowerCase().includes(queryIntent.processedQuery)) {
        suggestions.add(brand);
      }
    }
    
    // Add matching models
    const models = new Set(products.map(p => p.metadata.model).filter(Boolean));
    for (const model of models) {
      if (model?.toLowerCase().includes(queryIntent.processedQuery)) {
        suggestions.add(model);
      }
    }
    
    return Array.from(suggestions).slice(0, limit);
  }

  // Get trending/popular products
  getTrending(limit: number = 10): SearchResult[] {
    const products = productStore.getAll()
      .filter(p => p.stock > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);
    
    return products.map(p => this.toSearchResult(p));
  }

  // Get products by category
  getByCategory(category: string, limit: number = 20): SearchResult[] {
    const products = productStore.getAll()
      .filter(p => p.metadata.category?.toLowerCase() === category.toLowerCase())
      .filter(p => p.stock > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);
    
    return products.map(p => this.toSearchResult(p));
  }
}

export const searchService = new SearchService();
