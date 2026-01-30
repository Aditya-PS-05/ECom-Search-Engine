import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { Product, CreateProductRequest, ProductMetadata } from '../types';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'products.db');

class ProductDatabase {
  private db: Database.Database;

  constructor() {
    // make sure data dir exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        productId INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        rating REAL DEFAULT 0,
        ratingCount INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        currency TEXT DEFAULT 'Rupee',
        unitsSold INTEGER DEFAULT 0,
        returnRate REAL DEFAULT 0,
        complaints INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT DEFAULT '{}'
      )
    `);
    
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_title ON products(title)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_price ON products(price)`);
  }

  add(request: CreateProductRequest): Product | null {
    const stmt = this.db.prepare(`
      INSERT INTO products (title, description, rating, ratingCount, stock, price, mrp, currency, unitsSold, returnRate, complaints, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(
        request.title,
        request.description,
        request.rating ?? 0,
        request.ratingCount ?? 0,
        request.stock,
        request.price,
        request.mrp,
        request.currency ?? 'Rupee',
        request.unitsSold ?? 0,
        request.returnRate ?? 0,
        request.complaints ?? 0,
        JSON.stringify(request.metadata ?? {})
      );
      
      return this.get(result.lastInsertRowid as number)!;
    } catch {
      return null;
    }
  }

  get(id: number): Product | undefined {
    const stmt = this.db.prepare('SELECT * FROM products WHERE productId = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToProduct(row) : undefined;
  }

  getAll(): Product[] {
    const stmt = this.db.prepare('SELECT * FROM products');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToProduct(row));
  }

  update(id: number, updates: Partial<Product>): Product | undefined {
    const product = this.get(id);
    if (!product) return undefined;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.rating !== undefined) { fields.push('rating = ?'); values.push(updates.rating); }
    if (updates.stock !== undefined) { fields.push('stock = ?'); values.push(updates.stock); }
    if (updates.price !== undefined) { fields.push('price = ?'); values.push(updates.price); }
    if (updates.mrp !== undefined) { fields.push('mrp = ?'); values.push(updates.mrp); }

    if (fields.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE productId = ?`);
      stmt.run(...values);
    }

    return this.get(id);
  }

  updateMetadata(id: number, metadata: ProductMetadata): Product | undefined {
    const product = this.get(id);
    if (!product) return undefined;

    const merged = { ...product.metadata, ...metadata };
    const stmt = this.db.prepare('UPDATE products SET metadata = ? WHERE productId = ?');
    stmt.run(JSON.stringify(merged), id);

    return this.get(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM products WHERE productId = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM products');
    const row = stmt.get() as any;
    return row.count;
  }

  clear(): void {
    this.db.exec('DELETE FROM products');
  }

  bulkAdd(requests: CreateProductRequest[]): Product[] {
    const products: Product[] = [];
    const insert = this.db.transaction(() => {
      for (const req of requests) {
        const p = this.add(req);
        if (p) products.push(p);
      }
    });
    insert();
    return products;
  }

  private rowToProduct(row: any): Product {
    return {
      productId: row.productId,
      title: row.title,
      description: row.description,
      rating: row.rating,
      ratingCount: row.ratingCount,
      stock: row.stock,
      price: row.price,
      mrp: row.mrp,
      currency: row.currency,
      unitsSold: row.unitsSold,
      returnRate: row.returnRate,
      complaints: row.complaints,
      createdAt: new Date(row.createdAt),
      metadata: JSON.parse(row.metadata || '{}'),
    };
  }
}

export const productDatabase = new ProductDatabase();
