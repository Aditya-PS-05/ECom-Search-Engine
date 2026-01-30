import { Product, CreateProductRequest, ProductMetadata } from '../types';

class ProductStore {
  private products: Map<number, Product> = new Map();
  private nextId: number = 1;

  add(request: CreateProductRequest): Product {
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
    return product;
  }

  get(id: number): Product | undefined {
    return this.products.get(id);
  }

  update(id: number, updates: Partial<Product>): Product | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated = { ...product, ...updates, productId: id };
    this.products.set(id, updated);
    return updated;
  }

  updateMetadata(id: number, metadata: ProductMetadata): Product | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    product.metadata = { ...product.metadata, ...metadata };
    this.products.set(id, product);
    return product;
  }

  delete(id: number): boolean {
    return this.products.delete(id);
  }

  getAll(): Product[] {
    return Array.from(this.products.values());
  }

  count(): number {
    return this.products.size;
  }

  clear(): void {
    this.products.clear();
    this.nextId = 1;
  }

  bulkAdd(requests: CreateProductRequest[]): Product[] {
    return requests.map(req => this.add(req));
  }
}

export const productStore = new ProductStore();
