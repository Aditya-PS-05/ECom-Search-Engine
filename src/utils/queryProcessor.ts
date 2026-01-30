import { QueryIntent } from '../types';
import { 
  HINGLISH_MAPPINGS, 
  SPELLING_CORRECTIONS, 
  COLOR_MAPPINGS, 
  PRICE_PATTERNS,
  CATEGORY_KEYWORDS,
  BRANDS
} from './constants';

export class QueryProcessor {
  
  // takes raw query and processes it - fixes typos, translates hinglish, extracts intents
  processQuery(rawQuery: string): QueryIntent {
    let query = rawQuery.toLowerCase().trim();
    
    query = this.correctSpelling(query);
    query = this.translateHinglish(query);
    query = this.normalizeColors(query);
    
    const intents = this.extractIntents(query);
    const tokens = this.tokenize(query);
    
    return {
      originalQuery: rawQuery,
      processedQuery: query,
      tokens,
      intents,
    };
  }

  // fixes common typos like "ifone" -> "iphone"
  private correctSpelling(query: string): string {
    let corrected = query;
    
    // dictionary based correction first
    for (const [mistake, correction] of Object.entries(SPELLING_CORRECTIONS)) {
      const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
      corrected = corrected.replace(regex, correction);
    }
    
    // dont accidentally correct normal english words
    const protectedWords = new Set([
      'more', 'most', 'best', 'good', 'new', 'old', 'red', 'blue', 'green', 
      'black', 'white', 'gold', 'silver', 'pink', 'gray', 'grey', 'purple',
      'big', 'small', 'large', 'mini', 'max', 'pro', 'plus', 'ultra',
      'cheap', 'budget', 'premium', 'latest', 'strong', 'fast', 'slow',
      'under', 'below', 'above', 'price', 'rupees', 'storage', 'memory',
      'color', 'colour', 'cover', 'case', 'charger', 'cable'
    ]);
    
    // fuzzy match remaining words to brand names
    const words = corrected.split(/\s+/);
    const correctedWords = words.map(word => {
      if (word.length < 4) return word;
      if (protectedWords.has(word)) return word;
      
      const closestBrand = this.findClosestMatch(word, BRANDS, 1);
      if (closestBrand && closestBrand.length >= word.length - 1) {
        return closestBrand;
      }
      
      return word;
    });
    
    return correctedWords.join(' ');
  }

  // converts hinglish to english (sasta -> cheap, accha -> good etc)
  private translateHinglish(query: string): string {
    let translated = query;
    
    for (const [hinglish, englishOptions] of Object.entries(HINGLISH_MAPPINGS)) {
      const regex = new RegExp(`\\b${hinglish}\\b`, 'gi');
      if (regex.test(translated)) {
        translated = translated.replace(regex, englishOptions[0] || '');
      }
    }
    
    translated = translated.replace(/\s+/g, ' ').trim();
    return translated;
  }

  // hindi color names to english
  private normalizeColors(query: string): string {
    let normalized = query;
    
    for (const [hindi, english] of Object.entries(COLOR_MAPPINGS)) {
      const regex = new RegExp(`\\b${hindi}\\b`, 'gi');
      normalized = normalized.replace(regex, english);
    }
    
    return normalized;
  }

  // figure out what the user wants from the query
  private extractIntents(query: string): QueryIntent['intents'] {
    const intents: QueryIntent['intents'] = {
      isCheap: false,
      isExpensive: false,
      isLatest: false,
    };
    
    const cheapKeywords = ['cheap', 'budget', 'affordable', 'low price', 'sasta', 'value'];
    const expensiveKeywords = ['expensive', 'premium', 'flagship', 'high end', 'best', 'top'];
    const latestKeywords = ['latest', 'new', 'newest', 'recent', '2024', '2025', 'launched'];
    
    intents.isCheap = cheapKeywords.some(kw => query.includes(kw));
    intents.isExpensive = expensiveKeywords.some(kw => query.includes(kw));
    intents.isLatest = latestKeywords.some(kw => query.includes(kw));
    
    intents.priceRange = this.extractPriceRange(query);
    intents.color = this.extractColor(query);
    intents.storage = this.extractStorage(query);
    intents.brand = this.extractBrand(query);
    intents.category = this.extractCategory(query);
    
    return intents;
  }

  // parses stuff like "under 50k" or "50000 rupees"
  private extractPriceRange(query: string): { min?: number; max?: number } | undefined {
    for (const pattern of PRICE_PATTERNS) {
      const match = query.match(pattern.pattern);
      if (match) {
        let value = parseInt(match[1]);
        // 50k -> 50000
        if (query.includes('k') && value < 1000) {
          value *= 1000;
        }
        
        if (pattern.type === 'max') {
          return { max: value };
        } else if (pattern.type === 'around') {
          return { min: value * 0.8, max: value * 1.2 };
        }
      }
    }
    
    return undefined;
  }

  private extractColor(query: string): string | undefined {
    const colors = ['black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 
                    'purple', 'pink', 'gray', 'grey', 'yellow', 'orange'];
    
    for (const color of colors) {
      if (query.includes(color)) {
        return color === 'grey' ? 'gray' : color;
      }
    }
    
    return undefined;
  }

  private extractStorage(query: string): string | undefined {
    // "more storage" or "zyada storage" means user wants high storage
    const highStoragePatterns = [
      'more storage', 'high storage', 'maximum storage', 'max storage',
      'bigger storage', 'large storage', 'highest storage', 'most storage',
      'zyada storage', 'bada storage'
    ];
    
    if (highStoragePatterns.some(pattern => query.includes(pattern))) {
      return 'high';
    }
    
    // or they might specify exact like "128gb"
    const storageMatch = query.match(/(\d+)\s*(gb|tb)/i);
    if (storageMatch) {
      return `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
    }
    
    return undefined;
  }

  // maps product names to brands
  private extractBrand(query: string): string | undefined {
    const brandMappings: Record<string, string> = {
      'iphone': 'Apple',
      'ipad': 'Apple',
      'macbook': 'Apple',
      'airpods': 'Apple',
      'apple watch': 'Apple',
      'galaxy': 'Samsung',
      'samsung': 'Samsung',
      'oneplus': 'OnePlus',
      'one plus': 'OnePlus',
      'xiaomi': 'Xiaomi',
      'redmi': 'Redmi',
      'poco': 'Poco',
      'realme': 'Realme',
      'oppo': 'Oppo',
      'vivo': 'Vivo',
      'motorola': 'Motorola',
      'moto': 'Motorola',
      'nokia': 'Nokia',
      'google': 'Google',
      'pixel': 'Google',
      'sony': 'Sony',
      'jbl': 'JBL',
      'boat': 'Boat',
      'noise': 'Noise',
      'bose': 'Bose',
      'sennheiser': 'Sennheiser',
      'hp': 'HP',
      'dell': 'Dell',
      'lenovo': 'Lenovo',
      'asus': 'Asus',
      'acer': 'Acer',
      'msi': 'MSI',
    };
    
    for (const [keyword, brand] of Object.entries(brandMappings)) {
      if (query.includes(keyword)) {
        return brand;
      }
    }
    
    return undefined;
  }

  private extractCategory(query: string): string | undefined {
    // check accessories first since theyre more specific
    const accessoryKeywords = ['cover', 'case', 'charger', 'cable', 'adapter', 
                               'screen guard', 'tempered glass', 'power bank', 'protector'];
    if (accessoryKeywords.some(kw => query.includes(kw))) {
      return 'accessory';
    }
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === 'accessory') continue;
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return category;
        }
      }
    }
    
    return undefined;
  }

  // split query into tokens, remove stop words and intent words
  private tokenize(query: string): string[] {
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'for', 'of', 
                       'to', 'in', 'on', 'with', 'and', 'or', 'i', 'want', 'need',
                       'looking', 'search', 'find', 'show', 'me', 'please'];
    
    const intentWords = ['cheap', 'budget', 'affordable', 'expensive', 'premium',
                         'latest', 'new', 'best', 'good', 'top', 'under', 'below',
                         'rupees', 'rs', 'price', 'color', 'colour', 'more', 'storage'];
    
    const pricePattern = /^\d+k?$/i;
    
    const tokens = query
      .split(/\s+/)
      .filter(token => token.length > 1)
      .filter(token => !stopWords.includes(token))
      .filter(token => !intentWords.includes(token))
      .filter(token => !pricePattern.test(token));
    
    return tokens;
  }

  // levenshtein distance for fuzzy matching
  private findClosestMatch(word: string, candidates: string[], maxDistance: number): string | null {
    let closest: string | null = null;
    let minDistance = maxDistance + 1;
    
    for (const candidate of candidates) {
      const distance = this.levenshteinDistance(word, candidate);
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        closest = candidate;
      }
    }
    
    return closest;
  }

  // standard levenshtein algo - copied from stackoverflow lol
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
}

export const queryProcessor = new QueryProcessor();
