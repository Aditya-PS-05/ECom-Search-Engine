import { Product, CreateProductRequest, ProductMetadata } from '../types';
import { productDatabase } from './database';

// uses sqlite if USE_DB=true, otherwise in-memory
const USE_DB = process.env.USE_DB === 'true';

class ProductStore {
  private products: Map<number, Product> = new Map();
  private titleIndex: Set<string> = new Set();
  private nextId: number = 1;

  add(request: CreateProductRequest): Product | null {
    if (USE_DB) {
      return productDatabase.add(request);
    }
    
    const normalizedTitle = this.normalizeTitle(request.title);
    if (this.titleIndex.has(normalizedTitle)) {
      return null;
    }
    
    const product: Product = {
      productId: this.nextId++,
      title: request.title,
      description: request.description,
      rating: request.rating ?? 0,
      ratingCount: request.ratingCount ?? 0,
      stock: request.stock,
      price: request.price,
      mrp: request.mrp,
      currency: request.currency ?? 'Rupee',
      unitsSold: request.unitsSold ?? 0,
      returnRate: request.returnRate ?? 0,
      complaints: request.complaints ?? 0,
      createdAt: new Date(),
      metadata: request.metadata ?? {},
    };
    this.products.set(product.productId, product);
    this.titleIndex.add(normalizedTitle);
    return product;
  }

  private normalizeTitle(title: string): string {
    return title.toLowerCase().trim().slice(0, 80);
  }

  get(id: number): Product | undefined {
    if (USE_DB) return productDatabase.get(id);
    return this.products.get(id);
  }

  update(id: number, updates: Partial<Product>): Product | undefined {
    if (USE_DB) return productDatabase.update(id, updates);
    
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...updates, productId: id };
    this.products.set(id, updated);
    return updated;
  }

  updateMetadata(id: number, metadata: ProductMetadata): Product | undefined {
    if (USE_DB) return productDatabase.updateMetadata(id, metadata);
    
    const product = this.products.get(id);
    if (!product) return undefined;
    
    product.metadata = { ...product.metadata, ...metadata };
    this.products.set(id, product);
    return product;
  }

  delete(id: number): boolean {
    if (USE_DB) return productDatabase.delete(id);
    
    const product = this.products.get(id);
    if (product) {
      this.titleIndex.delete(this.normalizeTitle(product.title));
    }
    return this.products.delete(id);
  }

  getAll(): Product[] {
    if (USE_DB) return productDatabase.getAll();
    return Array.from(this.products.values());
  }

  count(): number {
    if (USE_DB) return productDatabase.count();
    return this.products.size;
  }

  clear(): void {
    if (USE_DB) { productDatabase.clear(); return; }
    this.products.clear();
    this.titleIndex.clear();
    this.nextId = 1;
  }

  bulkAdd(requests: CreateProductRequest[]): Product[] {
    if (USE_DB) return productDatabase.bulkAdd(requests);
    return requests
      .map(req => this.add(req))
      .filter((p): p is Product => p !== null);
  }

  isDuplicate(title: string): boolean {
    return this.titleIndex.has(this.normalizeTitle(title));
  }
}

export const productStore = new ProductStore();
