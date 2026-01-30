import * as fs from 'fs';
import * as path from 'path';
import { CreateProductRequest } from '../types';
import { scrapeProductsIncremental } from './scraperService';
import { generateAllProducts } from '../data/seedData';
import { productStore } from '../models/productStore';

const SCRAPED_DATA_PATH = path.join(__dirname, '..', 'data', 'scrapedProducts.json');

export function loadProductData(): CreateProductRequest[] {
  // Try loading pre-scraped data from JSON file first
  if (fs.existsSync(SCRAPED_DATA_PATH)) {
    try {
      const data = fs.readFileSync(SCRAPED_DATA_PATH, 'utf-8');
      const products = JSON.parse(data) as CreateProductRequest[];
      if (products.length > 0) {
        console.log(`📂 Loaded ${products.length} products from scraped data file`);
        return products;
      }
    } catch (err) {
      console.log('⚠️  Failed to parse scraped data file:', (err as Error).message);
    }
  }

  // Fall back to synthetic data for immediate startup
  console.log('🔄 Using synthetic data for immediate startup...');
  const syntheticProducts = generateAllProducts();
  console.log(`✅ Generated ${syntheticProducts.length} synthetic products`);
  return syntheticProducts;
}

export function saveScrapedData(products: CreateProductRequest[]): void {
  try {
    const dataDir = path.dirname(SCRAPED_DATA_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(products, null, 2));
  } catch (err) {
    console.log('⚠️  Failed to save scraped data:', (err as Error).message);
  }
}

export function startBackgroundScraping(): void {
  console.log('\n🌐 Starting background scraping (non-blocking)...');
  console.log('   Products will be added to catalog as they are scraped.\n');
  
  scrapeProductsIncremental({
    onProduct: (product) => {
      productStore.add(product);
    },
    onBatchComplete: (products, total) => {
      saveScrapedData(products);
      console.log(`💾 Saved ${total} scraped products to JSON`);
    },
    onComplete: (products) => {
      saveScrapedData(products);
      console.log(`\n✅ Background scraping complete: ${products.length} products saved`);
      console.log(`📊 Total products in catalog: ${productStore.count()}`);
    },
  });
}
