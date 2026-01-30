import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapedProduct {
  title: string;
  description: string;
  rating: number;
  ratingCount: number;
  price: number;
  mrp: number;
  currency: string;
  stock: number;
  unitsSold: number;
  returnRate: number;
  complaints: number;
  metadata: Record<string, string | number | undefined>;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals: number = 1) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SEARCH_QUERIES = [
  'iphone',
  'samsung galaxy phone',
  'oneplus phone',
  'redmi phone',
  'realme phone',
  'oppo phone',
  'vivo phone',
  'laptop',
  'macbook',
  'gaming laptop',
  'wireless earbuds',
  'bluetooth headphones',
  'smartwatch',
  'tablet',
  'ipad',
  'phone cover',
  'fast charger',
  'power bank',
  'screen protector',
];

async function scrapeFlipkartPage(query: string, page: number = 1): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&page=${page}`;

  try {
    console.log(`Scraping: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Flipkart product cards - multiple possible selectors
    const productCards = $('[data-id], .CGtC98, ._1AtVbE, .slAVV4, ._75nlfW').toArray();

    for (const card of productCards) {
      try {
        const $card = $(card);
        
        // Title extraction - try multiple selectors
        let title = $card.find('.KzDlHZ, ._4rR01T, .IRpwTa, .s1Q9rs, .WKTcLC').first().text().trim();
        if (!title) {
          title = $card.find('a[title]').first().attr('title') || '';
        }
        if (!title || title.length < 5) continue;

        // Price extraction
        let priceText = $card.find('._30jeq3, .Nx9bqj, ._1_WHN1').first().text().trim();
        let price = parseInt(priceText.replace(/[₹,]/g, '')) || 0;
        if (price === 0) continue;

        // MRP extraction
        let mrpText = $card.find('._3I9_wc, .yRaY8j, ._27UcVY').first().text().trim();
        let mrp = parseInt(mrpText.replace(/[₹,]/g, '')) || Math.round(price * 1.15);

        // Rating extraction
        let ratingText = $card.find('._3LWZlK, .XQDdHH').first().text().trim();
        let rating = parseFloat(ratingText) || randomFloat(3.5, 4.8, 1);

        // Rating count extraction
        let ratingCountText = $card.find('._2_R_DZ span, .Wphh3N').first().text().trim();
        let ratingCountMatch = ratingCountText.match(/[\d,]+/);
        let ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[0].replace(/,/g, '')) : randomInt(100, 10000);

        // Description - combine all features
        let features: string[] = [];
        $card.find('li._21lJbe, li.rgWa7D, ._21Ahn-, .fMghEO li').each((_, el) => {
          const text = $(el).text().trim();
          if (text) features.push(text);
        });
        let description = features.join('. ') || `High-quality ${title} with premium features.`;

        // Extract metadata from features
        const metadata = extractMetadata(title, features);

        products.push({
          title,
          description,
          rating: Math.min(rating, 5),
          ratingCount,
          price,
          mrp: Math.max(mrp, price),
          currency: 'Rupee',
          stock: randomInt(0, 500),
          unitsSold: randomInt(ratingCount * 2, ratingCount * 10),
          returnRate: randomFloat(1, 8, 1),
          complaints: randomInt(0, Math.floor(ratingCount * 0.02)),
          metadata,
        });
      } catch (err) {
        // Skip problematic products
      }
    }
  } catch (err) {
    console.error(`Error scraping ${url}:`, (err as Error).message);
  }

  return products;
}

function extractMetadata(title: string, features: string[]): Record<string, string | number | undefined> {
  const metadata: Record<string, string | number | undefined> = {};
  const titleLower = title.toLowerCase();
  const featureText = features.join(' ').toLowerCase();

  // Detect category
  if (titleLower.includes('laptop') || titleLower.includes('macbook') || titleLower.includes('notebook')) {
    metadata.category = 'laptop';
  } else if (titleLower.includes('watch') || titleLower.includes('band')) {
    metadata.category = 'smartwatch';
  } else if (titleLower.includes('earbuds') || titleLower.includes('headphone') || titleLower.includes('earphone') || titleLower.includes('airpods') || titleLower.includes('buds')) {
    metadata.category = 'headphone';
  } else if (titleLower.includes('cover') || titleLower.includes('case') || titleLower.includes('charger') || titleLower.includes('cable') || titleLower.includes('protector') || titleLower.includes('power bank')) {
    metadata.category = 'accessory';
  } else if (titleLower.includes('tablet') || titleLower.includes('ipad')) {
    metadata.category = 'tablet';
  } else {
    metadata.category = 'phone';
  }

  // Extract brand
  const brands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi', 'Realme', 'Oppo', 'Vivo', 'Motorola', 'Nokia', 'Google', 'Poco', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Sony', 'JBL', 'Boat', 'Noise', 'Bose', 'Sennheiser', 'Fire-Boltt', 'Amazfit', 'Garmin', 'Spigen', 'Anker', 'MI', 'Ambrane', 'pTron', 'Portronics', 'Nothing', 'iQOO', 'Tecno', 'Infinix'];
  for (const brand of brands) {
    if (titleLower.includes(brand.toLowerCase())) {
      metadata.brand = brand;
      break;
    }
  }

  // Extract RAM
  const ramMatch = (title + ' ' + featureText).match(/(\d+)\s*gb\s*ram/i);
  if (ramMatch) metadata.ram = `${ramMatch[1]}GB`;

  // Extract storage
  const storageMatch = (title + ' ' + featureText).match(/(\d+)\s*(gb|tb)\s*(rom|storage|ssd|internal)?/i);
  if (storageMatch) {
    const size = storageMatch[1];
    const unit = storageMatch[2].toUpperCase();
    metadata.storage = `${size}${unit}`;
  }

  // Extract color
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Purple', 'Pink', 'Gray', 'Grey', 'Yellow', 'Orange', 'Titanium', 'Graphite', 'Midnight', 'Starlight'];
  for (const color of colors) {
    if (titleLower.includes(color.toLowerCase())) {
      metadata.color = color;
      break;
    }
  }

  // Extract screen size
  const screenMatch = (title + ' ' + featureText).match(/(\d+\.?\d*)\s*(inch|inches|cm)/i);
  if (screenMatch) {
    metadata.screenSize = `${screenMatch[1]} inches`;
  }

  // Extract display type
  const displayTypes = ['AMOLED', 'Super AMOLED', 'OLED', 'LCD', 'IPS', 'Retina', 'LED'];
  for (const display of displayTypes) {
    if (featureText.includes(display.toLowerCase())) {
      metadata.displayType = display;
      break;
    }
  }

  // Extract processor
  const processorPatterns = [
    /snapdragon\s*\d+/i,
    /dimensity\s*\d+/i,
    /helio\s*\w+/i,
    /a\d+\s*bionic/i,
    /exynos\s*\d+/i,
    /intel\s*core\s*i\d/i,
    /amd\s*ryzen\s*\d/i,
    /apple\s*m\d/i,
  ];
  for (const pattern of processorPatterns) {
    const match = (title + ' ' + featureText).match(pattern);
    if (match) {
      metadata.processor = match[0];
      break;
    }
  }

  return metadata;
}

async function scrapeAmazonPage(query: string, page: number = 1): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&page=${page}`;

  try {
    console.log(`Scraping: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    $('[data-component-type="s-search-result"]').each((_, element) => {
      try {
        const $el = $(element);

        // Title
        const title = $el.find('h2 a span, .a-size-medium.a-color-base.a-text-normal').first().text().trim();
        if (!title || title.length < 5) return;

        // Price
        const priceWhole = $el.find('.a-price-whole').first().text().replace(/[,\.]/g, '');
        const price = parseInt(priceWhole) || 0;
        if (price === 0) return;

        // MRP
        const mrpText = $el.find('.a-text-price .a-offscreen').first().text();
        const mrp = parseInt(mrpText.replace(/[₹,\.]/g, '')) || Math.round(price * 1.15);

        // Rating
        const ratingText = $el.find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text();
        const ratingMatch = ratingText.match(/(\d\.?\d?)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : randomFloat(3.5, 4.8, 1);

        // Rating count
        const ratingCountText = $el.find('.a-size-base.s-underline-text, [aria-label*="ratings"]').first().text();
        const countMatch = ratingCountText.match(/[\d,]+/);
        const ratingCount = countMatch ? parseInt(countMatch[0].replace(/,/g, '')) : randomInt(100, 5000);

        // Description from features
        let features: string[] = [];
        $el.find('.a-size-base-plus.a-color-base, .a-size-medium.a-color-base').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 10) features.push(text);
        });
        const description = features.join('. ') || `Premium quality ${title}`;

        const metadata = extractMetadata(title, features);

        products.push({
          title,
          description,
          rating: Math.min(rating, 5),
          ratingCount,
          price,
          mrp: Math.max(mrp, price),
          currency: 'Rupee',
          stock: randomInt(0, 500),
          unitsSold: randomInt(ratingCount * 2, ratingCount * 10),
          returnRate: randomFloat(1, 8, 1),
          complaints: randomInt(0, Math.floor(ratingCount * 0.02)),
          metadata,
        });
      } catch (err) {
        // Skip problematic products
      }
    });
  } catch (err) {
    console.error(`Error scraping ${url}:`, (err as Error).message);
  }

  return products;
}

async function scrapeAllProducts(): Promise<ScrapedProduct[]> {
  const allProducts: ScrapedProduct[] = [];
  const seenTitles = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    for (let page = 1; page <= 3; page++) {
      // Try Flipkart first
      const flipkartProducts = await scrapeFlipkartPage(query, page);
      for (const product of flipkartProducts) {
        const normalizedTitle = product.title.toLowerCase().slice(0, 50);
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          allProducts.push(product);
        }
      }
      console.log(`  Flipkart ${query} page ${page}: ${flipkartProducts.length} products (Total: ${allProducts.length})`);

      // Add delay to avoid rate limiting
      await delay(randomInt(1000, 2000));

      // Try Amazon as backup
      const amazonProducts = await scrapeAmazonPage(query, page);
      for (const product of amazonProducts) {
        const normalizedTitle = product.title.toLowerCase().slice(0, 50);
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          allProducts.push(product);
        }
      }
      console.log(`  Amazon ${query} page ${page}: ${amazonProducts.length} products (Total: ${allProducts.length})`);

      await delay(randomInt(1000, 2000));

      // Stop if we have enough products
      if (allProducts.length >= 1200) {
        console.log(`\nReached target of 1200+ products!`);
        return allProducts;
      }
    }
  }

  return allProducts;
}

async function main() {
  console.log('Starting web scraper for electronics products...\n');
  console.log('Target: 1000+ products from Flipkart and Amazon India\n');

  const products = await scrapeAllProducts();

  console.log(`\nTotal unique products scraped: ${products.length}`);

  // Category breakdown
  const categories: Record<string, number> = {};
  for (const p of products) {
    const cat = (p.metadata.category as string) || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  ${cat}: ${count}`);
  }

  // Save to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'scrapedProducts.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  console.log(`\nProducts saved to: ${outputPath}`);

  // Generate TypeScript seed file
  const tsOutputPath = path.join(__dirname, '..', 'src', 'data', 'scrapedSeedData.ts');
  const tsContent = `// Auto-generated from web scraper on ${new Date().toISOString()}
import { CreateProductRequest } from '../types';

export const scrapedProducts: CreateProductRequest[] = ${JSON.stringify(products, null, 2)};

export function getScrapedProducts(): CreateProductRequest[] {
  return scrapedProducts;
}
`;
  fs.writeFileSync(tsOutputPath, tsContent);
  console.log(`TypeScript seed file saved to: ${tsOutputPath}`);
}

main().catch(console.error);
