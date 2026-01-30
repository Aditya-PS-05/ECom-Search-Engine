import axios from 'axios';
import * as cheerio from 'cheerio';
import { CreateProductRequest } from '../types';

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
  'iphone', 'samsung galaxy phone', 'oneplus phone', 'redmi phone', 'realme phone',
  'oppo phone', 'vivo phone', 'laptop', 'macbook', 'gaming laptop',
  'wireless earbuds', 'bluetooth headphones', 'smartwatch', 'tablet', 'ipad',
  'phone cover', 'fast charger', 'power bank', 'screen protector',
];

function extractMetadata(title: string, features: string[]): Record<string, string | undefined> {
  const metadata: Record<string, string | undefined> = {};
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
    metadata.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
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
  if (screenMatch) metadata.screenSize = `${screenMatch[1]} inches`;

  // Extract display type
  const displayTypes = ['AMOLED', 'Super AMOLED', 'OLED', 'LCD', 'IPS', 'Retina', 'LED'];
  for (const display of displayTypes) {
    if (featureText.includes(display.toLowerCase())) {
      metadata.displayType = display;
      break;
    }
  }

  return metadata;
}

async function scrapeFlipkartPage(query: string, page: number = 1): Promise<CreateProductRequest[]> {
  const products: CreateProductRequest[] = [];
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}&page=${page}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const productCards = $('[data-id], .CGtC98, ._1AtVbE, .slAVV4, ._75nlfW').toArray();

    for (const card of productCards) {
      try {
        const $card = $(card);
        
        let title = $card.find('.KzDlHZ, ._4rR01T, .IRpwTa, .s1Q9rs, .WKTcLC').first().text().trim();
        if (!title) title = $card.find('a[title]').first().attr('title') || '';
        if (!title || title.length < 5) continue;

        let priceText = $card.find('._30jeq3, .Nx9bqj, ._1_WHN1').first().text().trim();
        let price = parseInt(priceText.replace(/[₹,]/g, '')) || 0;
        if (price === 0) continue;

        let mrpText = $card.find('._3I9_wc, .yRaY8j, ._27UcVY').first().text().trim();
        let mrp = parseInt(mrpText.replace(/[₹,]/g, '')) || Math.round(price * 1.15);

        let ratingText = $card.find('._3LWZlK, .XQDdHH').first().text().trim();
        let rating = parseFloat(ratingText) || randomFloat(3.5, 4.8, 1);

        let ratingCountText = $card.find('._2_R_DZ span, .Wphh3N').first().text().trim();
        let ratingCountMatch = ratingCountText.match(/[\d,]+/);
        let ratingCount = ratingCountMatch ? parseInt(ratingCountMatch[0].replace(/,/g, '')) : randomInt(100, 10000);

        let features: string[] = [];
        $card.find('li._21lJbe, li.rgWa7D, ._21Ahn-, .fMghEO li').each((_, el) => {
          const text = $(el).text().trim();
          if (text) features.push(text);
        });
        let description = features.join('. ') || `High-quality ${title} with premium features.`;

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
          metadata: extractMetadata(title, features),
        });
      } catch {
        // Skip problematic products
      }
    }
  } catch (err) {
    console.error(`Scrape error for ${query}:`, (err as Error).message);
  }

  return products;
}

async function scrapeAmazonPage(query: string, page: number = 1): Promise<CreateProductRequest[]> {
  const products: CreateProductRequest[] = [];
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&page=${page}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    $('[data-component-type="s-search-result"]').each((_, element) => {
      try {
        const $el = $(element);
        const title = $el.find('h2 a span, .a-size-medium.a-color-base.a-text-normal').first().text().trim();
        if (!title || title.length < 5) return;

        const priceWhole = $el.find('.a-price-whole').first().text().replace(/[,\.]/g, '');
        const price = parseInt(priceWhole) || 0;
        if (price === 0) return;

        const mrpText = $el.find('.a-text-price .a-offscreen').first().text();
        const mrp = parseInt(mrpText.replace(/[₹,\.]/g, '')) || Math.round(price * 1.15);

        const ratingText = $el.find('.a-icon-star-small .a-icon-alt, .a-icon-star .a-icon-alt').first().text();
        const ratingMatch = ratingText.match(/(\d\.?\d?)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : randomFloat(3.5, 4.8, 1);

        const ratingCountText = $el.find('.a-size-base.s-underline-text').first().text();
        const countMatch = ratingCountText.match(/[\d,]+/);
        const ratingCount = countMatch ? parseInt(countMatch[0].replace(/,/g, '')) : randomInt(100, 5000);

        let features: string[] = [];
        $el.find('.a-size-base-plus.a-color-base').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 10) features.push(text);
        });

        products.push({
          title,
          description: features.join('. ') || `Premium quality ${title}`,
          rating: Math.min(rating, 5),
          ratingCount,
          price,
          mrp: Math.max(mrp, price),
          currency: 'Rupee',
          stock: randomInt(0, 500),
          unitsSold: randomInt(ratingCount * 2, ratingCount * 10),
          returnRate: randomFloat(1, 8, 1),
          complaints: randomInt(0, Math.floor(ratingCount * 0.02)),
          metadata: extractMetadata(title, features),
        });
      } catch {
        // Skip problematic products
      }
    });
  } catch (err) {
    console.error(`Scrape error for ${query}:`, (err as Error).message);
  }

  return products;
}

interface ScrapeCallbacks {
  onProduct?: (product: CreateProductRequest) => void;
  onBatchComplete?: (allProducts: CreateProductRequest[], total: number) => void;
  onComplete?: (allProducts: CreateProductRequest[]) => void;
}

export async function scrapeProductsIncremental(callbacks: ScrapeCallbacks): Promise<void> {
  const allProducts: CreateProductRequest[] = [];
  const seenTitles = new Set<string>();
  let batchCount = 0;

  for (const query of SEARCH_QUERIES) {
    for (let page = 1; page <= 2; page++) {
      // Amazon (more reliable than Flipkart which rate-limits)
      const amazonProducts = await scrapeAmazonPage(query, page);
      for (const product of amazonProducts) {
        const key = product.title.toLowerCase().slice(0, 50);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allProducts.push(product);
          callbacks.onProduct?.(product);
        }
      }

      await delay(randomInt(300, 600));

      // Flipkart (may be rate-limited)
      const flipkartProducts = await scrapeFlipkartPage(query, page);
      for (const product of flipkartProducts) {
        const key = product.title.toLowerCase().slice(0, 50);
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          allProducts.push(product);
          callbacks.onProduct?.(product);
        }
      }

      batchCount++;
      // Save every 5 batches
      if (batchCount % 5 === 0) {
        callbacks.onBatchComplete?.(allProducts, allProducts.length);
      }

      console.log(`  ${query} (page ${page}): ${allProducts.length} products`);
      await delay(randomInt(300, 600));
    }
  }

  callbacks.onComplete?.(allProducts);
}
