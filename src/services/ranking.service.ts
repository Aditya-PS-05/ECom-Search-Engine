import { Product, QueryIntent } from '../types';
import { RANKING_WEIGHTS, PENALTY_FACTORS, REPEAT_PURCHASE_BOOST } from '../utils/constants';
import { purchaseHistoryStore } from '../models/purchaseHistory';
import Fuse from 'fuse.js';

export class RankingService {
  
  // main scoring function - combines all factors
  calculateScore(product: Product, queryIntent: QueryIntent, textScore: number, userId?: string): number {
    const textRelevance = textScore * 100;
    const ratingScore = this.calculateRatingScore(product);
    const popularityScore = this.calculatePopularityScore(product);
    const priceScore = this.calculatePriceScore(product, queryIntent);
    const stockScore = this.calculateStockScore(product);
    const recencyScore = this.calculateRecencyScore(product);
    const discountScore = this.calculateDiscountScore(product);
    
    // weighted sum of all scores
    let score = 
      (textRelevance * RANKING_WEIGHTS.textRelevance) +
      (ratingScore * RANKING_WEIGHTS.rating) +
      (popularityScore * RANKING_WEIGHTS.popularity) +
      (priceScore * RANKING_WEIGHTS.price) +
      (stockScore * RANKING_WEIGHTS.stock) +
      (recencyScore * RANKING_WEIGHTS.recency) +
      (discountScore * RANKING_WEIGHTS.discount);
    
    score -= this.calculatePenalties(product);
    score += this.calculateIntentBoost(product, queryIntent);
    score += this.calculateRepeatPurchaseBoost(product, userId);
    
    // clamp between 0-100
    return Math.max(0, Math.min(100, score));
  }

  // Boost for products user has previously purchased
  private calculateRepeatPurchaseBoost(product: Product, userId?: string): number {
    if (!userId) return 0;

    const purchaseCount = purchaseHistoryStore.getPurchaseCount(userId, product.productId);
    if (purchaseCount === 0) return 0;

    // Base boost + additional boost per repeat purchase, capped at max
    const boost = REPEAT_PURCHASE_BOOST.baseBoost + 
      (purchaseCount - 1) * REPEAT_PURCHASE_BOOST.perPurchaseBoost;
    
    return Math.min(boost, REPEAT_PURCHASE_BOOST.maxBoost);
  }

  // uses bayesian average so products with few ratings dont get unfair advantage
  private calculateRatingScore(product: Product): number {
    if (product.ratingCount === 0) return 30;
    
    // bayesian avg formula from wikipedia lol
    const C = 100; // min ratings needed
    const m = 3.5; // prior mean
    
    const bayesianRating = 
      (product.ratingCount * product.rating + C * m) / (product.ratingCount + C);
    
    return (bayesianRating / 5) * 100;
  }

  // log scale so bestsellers dont completely dominate
  private calculatePopularityScore(product: Product): number {
    const maxExpectedSales = 100000;
    const normalizedSales = Math.min(product.unitsSold, maxExpectedSales) / maxExpectedSales;
    
    const logScore = Math.log10(1 + normalizedSales * 9) / Math.log10(10);
    
    return logScore * 100;
  }

  // price scoring based on user intent
  private calculatePriceScore(product: Product, queryIntent: QueryIntent): number {
    const { intents } = queryIntent;
    
    // user wants cheap stuff
    if (intents.isCheap) {
      const maxPrice = 200000;
      const normalizedPrice = Math.min(product.price, maxPrice) / maxPrice;
      return (1 - normalizedPrice) * 100;
    }
    
    // user wants premium/expensive
    if (intents.isExpensive) {
      const maxPrice = 200000;
      const normalizedPrice = Math.min(product.price, maxPrice) / maxPrice;
      return normalizedPrice * 100;
    }
    
    // specific price range given
    if (intents.priceRange) {
      const { min, max } = intents.priceRange;
      
      if (max && product.price <= max) {
        return (product.price / max) * 100;
      }
      
      if (min && max && product.price >= min && product.price <= max) {
        return 100;
      }
      
      return 20; // outside range
    }
    
    // default - just use discount %
    const discountPercent = ((product.mrp - product.price) / product.mrp) * 100;
    return Math.min(discountPercent * 2, 100);
  }

  // higher stock = higher score
  private calculateStockScore(product: Product): number {
    if (product.stock === 0) return 0;
    if (product.stock < 5) return 30;
    if (product.stock < 20) return 60;
    if (product.stock < 100) return 80;
    return 100;
  }

  // newer products get slight boost
  private calculateRecencyScore(product: Product): number {
    const now = new Date();
    const productDate = new Date(product.createdAt);
    const daysSinceCreation = (now.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreation <= 30) return 100;
    if (daysSinceCreation <= 90) return 70;
    if (daysSinceCreation <= 180) return 50;
    if (daysSinceCreation <= 365) return 30;
    return 10;
  }

  private calculateDiscountScore(product: Product): number {
    const discountPercent = ((product.mrp - product.price) / product.mrp) * 100;
    return Math.min(discountPercent * 2, 100);
  }

  // penalize bad products
  private calculatePenalties(product: Product): number {
    let penalty = 0;
    
    if (product.stock === 0) {
      penalty += PENALTY_FACTORS.outOfStock * 50;
    }
    
    // return rate above 5% is bad
    if (product.returnRate > 5) {
      penalty += (product.returnRate - 5) * PENALTY_FACTORS.highReturnRate * 10;
    }
    
    // too many complaints
    if (product.complaints > 10) {
      penalty += (product.complaints - 10) * PENALTY_FACTORS.complaints * 10;
    }
    
    return Math.min(penalty, 30);
  }

  // boost score if product matches what user is looking for
  private calculateIntentBoost(product: Product, queryIntent: QueryIntent): number {
    let boost = 0;
    const { intents } = queryIntent;
    const metadata = product.metadata;
    
    // color match
    if (intents.color && metadata.color) {
      if (metadata.color.toLowerCase() === intents.color.toLowerCase()) {
        boost += 15;
      }
    }
    
    // storage match
    if (intents.storage) {
      if (intents.storage === 'high') {
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
    
    // brand match
    if (intents.brand && metadata.brand) {
      if (metadata.brand.toLowerCase() === intents.brand.toLowerCase()) {
        boost += 10;
      }
    }
    
    // category match
    if (intents.category && metadata.category) {
      if (metadata.category.toLowerCase() === intents.category.toLowerCase()) {
        boost += 10;
      }
    }
    
    // latest model keywords
    if (intents.isLatest) {
      const latestModels = ['16', '15', '24', '14', '13', 'pro', 'ultra', 'max', 'plus'];
      const titleLower = product.title.toLowerCase();
      if (latestModels.some(model => titleLower.includes(model))) {
        boost += 10;
      }
    }
    
    return boost;
  }

  // fuzzy search using fuse.js
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
  rankProducts(products: Product[], queryIntent: QueryIntent, userId?: string): Product[] {
    return this.rankProductsWithScores(products, queryIntent, userId).map(p => p.product);
  }

  // Rank products and return with scores
  rankProductsWithScores(products: Product[], queryIntent: QueryIntent, userId?: string): Array<{ product: Product; score: number }> {
    // Get text matching scores
    const textScores = this.performTextMatch(products, queryIntent);
    
    // Calculate final scores for matched products
    const scoredProducts: Array<{ product: Product; score: number }> = [];
    
    for (const product of products) {
      const textScore = textScores.get(product.productId);
      
      // Only include products that matched text search (or if no search terms)
      if (textScore !== undefined) {
        const finalScore = this.calculateScore(product, queryIntent, textScore, userId);
        scoredProducts.push({ product, score: finalScore });
      }
    }
    
    // Sort by score descending
    scoredProducts.sort((a, b) => b.score - a.score);
    
    // Apply post-ranking adjustments
    return this.applyPostRankingRulesWithScores(scoredProducts, queryIntent);
  }

  // Apply business rules after initial ranking
  private applyPostRankingRules(
    scoredProducts: Array<{ product: Product; score: number }>,
    queryIntent: QueryIntent
  ): Product[] {
    return this.applyPostRankingRulesWithScores(scoredProducts, queryIntent).map(sp => sp.product);
  }

  // Apply business rules after initial ranking (preserves scores)
  private applyPostRankingRulesWithScores(
    scoredProducts: Array<{ product: Product; score: number }>,
    queryIntent: QueryIntent
  ): Array<{ product: Product; score: number }> {
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
    
    return reordered;
  }
}

export const rankingService = new RankingService();
