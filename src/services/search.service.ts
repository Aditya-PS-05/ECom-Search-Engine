import { Product, SearchQuery, SearchResult, QueryIntent } from '../types';
import { productStore } from '../models/productStore';
import { purchaseHistoryStore } from '../models/purchaseHistory';
import { queryProcessor } from '../utils/queryProcessor';
import { rankingService } from './ranking.service';

export class SearchService {
  
  search(searchQuery: SearchQuery): { results: SearchResult[]; total: number; queryInfo: QueryIntent } {
    const startTime = Date.now();
    
    // process query - fix typos, translate hinglish etc
    const queryIntent = queryProcessor.processQuery(searchQuery.query);
    
    let products = productStore.getAll();
    products = this.applyFilters(products, searchQuery, queryIntent);
    
    // rank and sort - now returns products with scores (userId for repeat purchase boost)
    const rankedProductsWithScores = rankingService.rankProductsWithScores(products, queryIntent, searchQuery.userId);
    const sortedProducts = this.applySortingWithScores(rankedProductsWithScores, searchQuery.sortBy);
    
    // paginate
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const start = (page - 1) * limit;
    const paginatedProducts = sortedProducts.slice(start, start + limit);
    
    const results = paginatedProducts.map(({ product, score }) => 
      this.toSearchResult(product, score, searchQuery.userId)
    );
    
    const endTime = Date.now();
    console.log(`Search completed in ${endTime - startTime}ms for query: "${searchQuery.query}"`);
    
    return {
      results,
      total: sortedProducts.length,
      queryInfo: queryIntent,
    };
  }

  // filter products based on query params and detected intents
  private applyFilters(products: Product[], searchQuery: SearchQuery, queryIntent: QueryIntent): Product[] {
    let filtered = products;
    
    // category
    if (searchQuery.category) {
      filtered = filtered.filter(p => 
        p.metadata.category?.toLowerCase() === searchQuery.category!.toLowerCase()
      );
    } else if (queryIntent.intents.category === 'accessory') {
      // accessories are filtered strictly
      filtered = filtered.filter(p => 
        p.metadata.category?.toLowerCase() === 'accessory'
      );
    }
    
    // brand filter
    if (searchQuery.brand) {
      filtered = filtered.filter(p => 
        p.metadata.brand?.toLowerCase() === searchQuery.brand!.toLowerCase()
      );
    }
    
    // price range
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
    
    // rating
    if (searchQuery.minRating !== undefined) {
      filtered = filtered.filter(p => p.rating >= searchQuery.minRating!);
    }
    
    // stock
    if (searchQuery.inStock === true) {
      filtered = filtered.filter(p => p.stock > 0);
    }
    
    // color - soft filter, put matching colors first but keep others
    if (queryIntent.intents.color) {
      const colorInQuery = queryIntent.processedQuery.includes(queryIntent.intents.color);
      if (colorInQuery) {
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

  private applySortingWithScores(
    products: Array<{ product: Product; score: number }>,
    sortBy?: string
  ): Array<{ product: Product; score: number }> {
    if (!sortBy || sortBy === 'relevance') {
      return products;
    }
    
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price_asc':
        sorted.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'rating':
        sorted.sort((a, b) => {
          if (b.product.rating !== a.product.rating) return b.product.rating - a.product.rating;
          return b.product.ratingCount - a.product.ratingCount;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => 
          new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime()
        );
        break;
      case 'popularity':
        sorted.sort((a, b) => b.product.unitsSold - a.product.unitsSold);
        break;
      case 'discount':
        sorted.sort((a, b) => {
          const discountA = (a.product.mrp - a.product.price) / a.product.mrp;
          const discountB = (b.product.mrp - b.product.price) / b.product.mrp;
          return discountB - discountA;
        });
        break;
    }
    
    return sorted;
  }

  // Transform Product to SearchResult
  private toSearchResult(product: Product, score?: number, userId?: string): SearchResult {
    const repeatPurchaseCount = userId 
      ? purchaseHistoryStore.getPurchaseCount(userId, product.productId) 
      : undefined;

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
      score: score !== undefined ? Math.round(score * 100) / 100 : undefined,
      repeatPurchaseCount: repeatPurchaseCount || undefined,
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
