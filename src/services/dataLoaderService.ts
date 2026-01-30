import * as fs from 'fs';
import * as path from 'path';
import { CreateProductRequest } from '../types';
import { scrapeProductsIncremental } from './scraperService';
import { generateAllProducts } from '../data/seedData';
import { productStore } from '../models/productStore';

const SCRAPED_DATA_PATH = path.join(__dirname, '..', 'data', 'scrapedProducts.json');

// tries to load scraped data first, falls back to synthetic
export function loadProductData(): CreateProductRequest[] {
  if (fs.existsSync(SCRAPED_DATA_PATH)) {
    try {
      const data = fs.readFileSync(SCRAPED_DATA_PATH, 'utf-8');
      const products = JSON.parse(data) as CreateProductRequest[];
      if (products.length > 0) {
        console.log(`Loaded ${products.length} products from scraped file`);
        return products;
      }
    } catch (err) {
      console.log('Failed to parse scraped data:', (err as Error).message);
    }
  }

  // no scraped data, generate synthetic
  console.log('Using synthetic data...');
  const syntheticProducts = generateAllProducts();
  console.log(`Generated ${syntheticProducts.length} products`);
  return syntheticProducts;
}

// saves products to json file
export function saveScrapedData(products: CreateProductRequest[]): void {
  try {
    const dataDir = path.dirname(SCRAPED_DATA_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(products, null, 2));
  } catch (err) {
    console.log('Failed to save scraped data:', (err as Error).message);
  }
}

// runs scraper in background, adds products as they come
export function startBackgroundScraping(): void {
  console.log('Starting background scraping...');
  
  scrapeProductsIncremental({
    onProduct: (product) => {
      productStore.add(product);
    },
    onBatchComplete: (products, total) => {
      saveScrapedData(products);
      console.log(`Saved ${total} scraped products`);
    },
    onComplete: (products) => {
      saveScrapedData(products);
      console.log(`Scraping done: ${products.length} products`);
      console.log(`Total in catalog: ${productStore.count()}`);
    },
  });
}
