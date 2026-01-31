// In-memory store for user purchase history
// In production, this would be a database

interface PurchaseRecord {
  productId: number;
  purchaseCount: number;
  lastPurchasedAt: Date;
}

class PurchaseHistoryStore {
  // userId -> Map of productId -> PurchaseRecord
  private history: Map<string, Map<number, PurchaseRecord>> = new Map();

  // Record a purchase
  addPurchase(userId: string, productId: number): void {
    if (!this.history.has(userId)) {
      this.history.set(userId, new Map());
    }

    const userHistory = this.history.get(userId)!;
    const existing = userHistory.get(productId);

    if (existing) {
      existing.purchaseCount += 1;
      existing.lastPurchasedAt = new Date();
    } else {
      userHistory.set(productId, {
        productId,
        purchaseCount: 1,
        lastPurchasedAt: new Date(),
      });
    }
  }

  // Get purchase history for a user
  getUserPurchases(userId: string): PurchaseRecord[] {
    const userHistory = this.history.get(userId);
    if (!userHistory) return [];
    return Array.from(userHistory.values());
  }

  // Get purchased product IDs for a user
  getPurchasedProductIds(userId: string): Set<number> {
    const userHistory = this.history.get(userId);
    if (!userHistory) return new Set();
    return new Set(userHistory.keys());
  }

  // Get purchase count for a specific product by user
  getPurchaseCount(userId: string, productId: number): number {
    const userHistory = this.history.get(userId);
    if (!userHistory) return 0;
    return userHistory.get(productId)?.purchaseCount || 0;
  }

  // Check if user has purchased a product
  hasPurchased(userId: string, productId: number): boolean {
    return this.getPurchaseCount(userId, productId) > 0;
  }

  // Clear history for a user (for testing)
  clearUserHistory(userId: string): void {
    this.history.delete(userId);
  }
}

export const purchaseHistoryStore = new PurchaseHistoryStore();
