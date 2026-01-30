import { Product, QueryIntent } from '../types';
import { RANKING_WEIGHTS, PENALTY_FACTORS } from '../utils/constants';
import Fuse from 'fuse.js';

export class RankingService {
  
  // Calculate overall ranking score for a product given a query
  calculateScore(product: Product, queryIntent: QueryIntent, textScore: number): number {
    // Base scores (0-100 scale)
    const textRelevance = textScore * 100;
    const ratingScore = this.calculateRatingScore(product);
    const popularityScore = this.calculatePopularityScore(product);
    const priceScore = this.calculatePriceScore(product, queryIntent);
    const stockScore = this.calculateStockScore(product);
    const recencyScore = this.calculateRecencyScore(product);
    const discountScore = this.calculateDiscountScore(product);
    
    // Weighted combination
    let score = 
      (textRelevance * RANKING_WEIGHTS.textRelevance) +
      (ratingScore * RANKING_WEIGHTS.rating) +
      (popularityScore * RANKING_WEIGHTS.popularity) +
      (priceScore * RANKING_WEIGHTS.price) +
      (stockScore * RANKING_WEIGHTS.stock) +
      (recencyScore * RANKING_WEIGHTS.recency) +
      (discountScore * RANKING_WEIGHTS.discount);
    
    // Apply penalties
    score -= this.calculatePenalties(product);
    
    // Apply intent-based boosts
    score += this.calculateIntentBoost(product, queryIntent);
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  // Rating score: considers both rating value and number of ratings
  private calculateRatingScore(product: Product): number {
    if (product.ratingCount === 0) return 30; // Default for unrated products
    
    // Bayesian average to handle products with few ratings
    const C = 100; // Minimum ratings threshold
    const m = 3.5; // Prior mean rating
    
    const bayesianRating = 
      (product.ratingCount * product.rating + C * m) / (product.ratingCount + C);
    
    // Scale to 0-100
    return (bayesianRating / 5) * 100;
  }

  // Popularity score: based on units sold
  private calculatePopularityScore(product: Product): number {
    // Logarithmic scale to prevent runaway scores for bestsellers
    const maxExpectedSales = 100000;
    const normalizedSales = Math.min(product.unitsSold, maxExpectedSales) / maxExpectedSales;
    
    // Use logarithmic scale
    const logScore = Math.log10(1 + normalizedSales * 9) / Math.log10(10);
    
    return logScore * 100;
  }

  // Price score: considers discount and value proposition
  private calculatePriceScore(product: Product, queryIntent: QueryIntent): number {
    const { intents } = queryIntent;
    
    // If user wants cheap products, lower price = higher score
    if (intents.isCheap) {
      // Inverse relationship - cheaper is better
      const maxPrice = 200000;
      const normalizedPrice = Math.min(product.price, maxPrice) / maxPrice;
      return (1 - normalizedPrice) * 100;
    }
    
    // If user wants expensive/premium products, higher price = higher score
    if (intents.isExpensive) {
      const maxPrice = 200000;
      const normalizedPrice = Math.min(product.price, maxPrice) / maxPrice;
      return normalizedPrice * 100;
    }
    
    // If price range specified, check if product fits
    if (intents.priceRange) {
      const { min, max } = intents.priceRange;
      
      if (max && product.price <= max) {
        // Prefer products closer to max (better value at higher price)
        return (product.price / max) * 100;
      }
      
      if (min && max && product.price >= min && product.price <= max) {
        return 100; // Perfect match
      }
      
      // Outside range - penalize
      return 20;
    }
    
    // Default: prefer mid-range products with good discounts
    const discountPercent = ((product.mrp - product.price) / product.mrp) * 100;
    return Math.min(discountPercent * 2, 100);
  }

  // Stock score: in-stock products rank higher
  private calculateStockScore(product: Product): number {
    if (product.stock === 0) return 0;
    if (product.stock < 5) return 30;  // Low stock
    if (product.stock < 20) return 60; // Medium stock
    if (product.stock < 100) return 80; // Good stock
    return 100; // Excellent stock
  }

  // Recency score: newer products get a boost
  private calculateRecencyScore(product: Product): number {
    const now = new Date();
    const productDate = new Date(product.createdAt);
    const daysSinceCreation = (now.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Products added in last 30 days get full score
    if (daysSinceCreation <= 30) return 100;
    if (daysSinceCreation <= 90) return 70;
    if (daysSinceCreation <= 180) return 50;
    if (daysSinceCreation <= 365) return 30;
    return 10;
  }

  // Discount score: better discounts rank higher
  private calculateDiscountScore(product: Product): number {
    const discountPercent = ((product.mrp - product.price) / product.mrp) * 100;
    return Math.min(discountPercent * 2, 100);
  }

  // Calculate penalties for poor product metrics
  private calculatePenalties(product: Product): number {
    let penalty = 0;
    
    // Out of stock penalty
    if (product.stock === 0) {
      penalty += PENALTY_FACTORS.outOfStock * 50;
    }
    
    // High return rate penalty (above 5%)
    if (product.returnRate > 5) {
      penalty += (product.returnRate - 5) * PENALTY_FACTORS.highReturnRate * 10;
    }
    
    // Complaints penalty (above 10 complaints)
    if (product.complaints > 10) {
      penalty += (product.complaints - 10) * PENALTY_FACTORS.complaints * 10;
    }
    
    return Math.min(penalty, 30); // Cap penalty at 30 points
  }

  // Calculate boost based on query intent matching
  private calculateIntentBoost(product: Product, queryIntent: QueryIntent): number {
    let boost = 0;
    const { intents } = queryIntent;
    const metadata = product.metadata;
    
    // Color match boost
    if (intents.color && metadata.color) {
      if (metadata.color.toLowerCase() === intents.color.toLowerCase()) {
        boost += 15;
      }
    }
    
    // Storage match boost
    if (intents.storage) {
      if (intents.storage === 'high') {
        // Boost products with higher storage
        const storage = metadata.storage?.replace(/[^0-9]/g, '');
        if (storage) {
          const storageNum = parseInt(storage);
          if (storageNum >= 512) boost += 15;
          else if (storageNum >= 256) boost += 10;
        }
      } else if (metadata.storage?.toLowerCase().includes(intents.storage.toLowerCase())) {
        boost += 15;
      }
    }
    
    // Brand match boost
    if (intents.brand && metadata.brand) {
      if (metadata.brand.toLowerCase() === intents.brand.toLowerCase()) {
        boost += 10;
      }
    }
    
    // Category match boost
    if (intents.category && metadata.category) {
      if (metadata.category.toLowerCase() === intents.category.toLowerCase()) {
        boost += 10;
      }
    }
    
    // Latest model boost
    if (intents.isLatest) {
      const latestModels = ['16', '15', '24', '14', '13', 'pro', 'ultra', 'max', 'plus'];
      const titleLower = product.title.toLowerCase();
      if (latestModels.some(model => titleLower.includes(model))) {
        boost += 10;
      }
    }
    
    return boost;
  }

  // Perform fuzzy text matching and return normalized score (0-1)
  performTextMatch(products: Product[], queryIntent: QueryIntent): Map<number, number> {
    const scores = new Map<number, number>();
    const searchTerms = queryIntent.tokens.join(' ');
    
    if (!searchTerms) {
      // No search terms - return all products with default score
      products.forEach(p => scores.set(p.productId, 0.5));
      return scores;
    }
    
    // Configure Fuse.js for fuzzy search
    const fuse = new Fuse(products, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.2 },
        { name: 'metadata.brand', weight: 0.15 },
        { name: 'metadata.model', weight: 0.15 },
        { name: 'metadata.category', weight: 0.1 },
      ],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: true,
    });
    
    const results = fuse.search(searchTerms);
    
    // Convert Fuse scores (0 = perfect, 1 = no match) to our scale (1 = perfect, 0 = no match)
    results.forEach(result => {
      const score = 1 - (result.score || 0);
      scores.set(result.item.productId, score);
    });
    
    return scores;
  }

  // Rank products based on query
  rankProducts(products: Product[], queryIntent: QueryIntent): Product[] {
    // Get text matching scores
    const textScores = this.performTextMatch(products, queryIntent);
    
    // Calculate final scores for matched products
    const scoredProducts: Array<{ product: Product; score: number }> = [];
    
    for (const product of products) {
      const textScore = textScores.get(product.productId);
      
      // Only include products that matched text search (or if no search terms)
      if (textScore !== undefined) {
        const finalScore = this.calculateScore(product, queryIntent, textScore);
        scoredProducts.push({ product, score: finalScore });
      }
    }
    
    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);
    
    // Apply post-ranking adjustments
    return this.applyPostRankingRules(scoredProducts, queryIntent);
  }

  // Apply business rules after initial ranking
  private applyPostRankingRules(
    scoredProducts: Array<{ product: Product; score: number }>,
    queryIntent: QueryIntent
  ): Product[] {
    // Rule 1: Never show out-of-stock products in top 10 unless very relevant
    const inStock = scoredProducts.filter(p => p.product.stock > 0);
    const outOfStock = scoredProducts.filter(p => p.product.stock === 0);
    
    // Interleave: show in-stock first, then out-of-stock at the end
    const reordered = [...inStock];
    
    // Add highly relevant out-of-stock products (score > 70) after position 10
    const relevantOutOfStock = outOfStock.filter(p => p.score > 70);
    if (reordered.length >= 10) {
      reordered.push(...relevantOutOfStock);
    } else {
      // If we don't have 10 in-stock, add some out-of-stock
      reordered.push(...outOfStock.slice(0, Math.max(0, 20 - reordered.length)));
    }
    
    // Rule 2: If searching for accessories, boost exact product compatibility
    if (queryIntent.intents.category === 'accessory') {
      // Products that match the specific phone model should rank higher
      // This is already handled in intent boost
    }
    
    return reordered.map(sp => sp.product);
  }
}

export const rankingService = new RankingService();
