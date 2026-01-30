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
  
  // Process the raw query and extract intents
  processQuery(rawQuery: string): QueryIntent {
    let query = rawQuery.toLowerCase().trim();
    
    // Step 1: Fix spelling mistakes
    query = this.correctSpelling(query);
    
    // Step 2: Translate Hinglish to English
    query = this.translateHinglish(query);
    
    // Step 3: Normalize colors
    query = this.normalizeColors(query);
    
    // Step 4: Extract intents
    const intents = this.extractIntents(query);
    
    // Step 5: Tokenize
    const tokens = this.tokenize(query);
    
    return {
      originalQuery: rawQuery,
      processedQuery: query,
      tokens,
      intents,
    };
  }

  // Correct common spelling mistakes using dictionary and fuzzy matching
  private correctSpelling(query: string): string {
    let corrected = query;
    
    // Direct dictionary lookup
    for (const [mistake, correction] of Object.entries(SPELLING_CORRECTIONS)) {
      const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
      corrected = corrected.replace(regex, correction);
    }
    
    // Fuzzy matching for unknown words
    const words = corrected.split(/\s+/);
    const correctedWords = words.map(word => {
      if (word.length < 3) return word;
      
      // Check if word is close to any known brand
      const closestBrand = this.findClosestMatch(word, BRANDS, 2);
      if (closestBrand) return closestBrand;
      
      return word;
    });
    
    return correctedWords.join(' ');
  }

  // Translate Hinglish terms to English
  private translateHinglish(query: string): string {
    let translated = query;
    
    for (const [hinglish, englishOptions] of Object.entries(HINGLISH_MAPPINGS)) {
      const regex = new RegExp(`\\b${hinglish}\\b`, 'gi');
      if (regex.test(translated)) {
        // Replace with the first (most common) English equivalent
        translated = translated.replace(regex, englishOptions[0] || '');
      }
    }
    
    // Clean up extra spaces
    translated = translated.replace(/\s+/g, ' ').trim();
    
    return translated;
  }

  // Normalize Hindi color names to English
  private normalizeColors(query: string): string {
    let normalized = query;
    
    for (const [hindi, english] of Object.entries(COLOR_MAPPINGS)) {
      const regex = new RegExp(`\\b${hindi}\\b`, 'gi');
      normalized = normalized.replace(regex, english);
    }
    
    return normalized;
  }

  // Extract search intents from query
  private extractIntents(query: string): QueryIntent['intents'] {
    const intents: QueryIntent['intents'] = {
      isCheap: false,
      isExpensive: false,
      isLatest: false,
    };
    
    // Check for price intent
    const cheapKeywords = ['cheap', 'budget', 'affordable', 'low price', 'sasta', 'value'];
    const expensiveKeywords = ['expensive', 'premium', 'flagship', 'high end', 'best', 'top'];
    const latestKeywords = ['latest', 'new', 'newest', 'recent', '2024', '2025', 'launched'];
    
    intents.isCheap = cheapKeywords.some(kw => query.includes(kw));
    intents.isExpensive = expensiveKeywords.some(kw => query.includes(kw));
    intents.isLatest = latestKeywords.some(kw => query.includes(kw));
    
    // Extract price range
    intents.priceRange = this.extractPriceRange(query);
    
    // Extract color
    intents.color = this.extractColor(query);
    
    // Extract storage
    intents.storage = this.extractStorage(query);
    
    // Extract brand
    intents.brand = this.extractBrand(query);
    
    // Extract category
    intents.category = this.extractCategory(query);
    
    return intents;
  }

  // Extract price range from query
  private extractPriceRange(query: string): { min?: number; max?: number } | undefined {
    for (const pattern of PRICE_PATTERNS) {
      const match = query.match(pattern.pattern);
      if (match) {
        let value = parseInt(match[1]);
        // Handle 'k' suffix (e.g., 50k = 50000)
        if (query.includes('k') && value < 1000) {
          value *= 1000;
        }
        
        if (pattern.type === 'max') {
          return { max: value };
        } else if (pattern.type === 'around') {
          // Allow 20% variance for "around" prices
          return { min: value * 0.8, max: value * 1.2 };
        }
      }
    }
    
    return undefined;
  }

  // Extract color from query
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

  // Extract storage requirement from query
  private extractStorage(query: string): string | undefined {
    // Check for "more storage" or "high storage" intent
    const highStoragePatterns = [
      'more storage', 'high storage', 'maximum storage', 'max storage',
      'bigger storage', 'large storage', 'highest storage', 'most storage',
      'zyada storage', 'bada storage' // Hinglish
    ];
    
    if (highStoragePatterns.some(pattern => query.includes(pattern))) {
      return 'high';
    }
    
    // Extract specific storage values
    const storageMatch = query.match(/(\d+)\s*(gb|tb)/i);
    if (storageMatch) {
      return `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
    }
    
    return undefined;
  }

  // Extract brand from query
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

  // Extract category from query
  private extractCategory(query: string): string | undefined {
    // Check accessory keywords first (they're more specific)
    const accessoryKeywords = ['cover', 'case', 'charger', 'cable', 'adapter', 
                               'screen guard', 'tempered glass', 'power bank', 'protector'];
    if (accessoryKeywords.some(kw => query.includes(kw))) {
      return 'accessory';
    }
    
    // Then check other categories
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === 'accessory') continue; // Already checked
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return category;
        }
      }
    }
    
    return undefined;
  }

  // Tokenize query for search
  private tokenize(query: string): string[] {
    // Remove common stop words and intent words (they shouldn't be searched as text)
    const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'for', 'of', 
                       'to', 'in', 'on', 'with', 'and', 'or', 'i', 'want', 'need',
                       'looking', 'search', 'find', 'show', 'me', 'please'];
    
    // Intent words - these are used for ranking, not text matching
    const intentWords = ['cheap', 'budget', 'affordable', 'expensive', 'premium',
                         'latest', 'new', 'best', 'good', 'top', 'under', 'below',
                         'rupees', 'rs', 'price', 'color', 'colour', 'more', 'storage'];
    
    const tokens = query
      .split(/\s+/)
      .filter(token => token.length > 1)
      .filter(token => !stopWords.includes(token))
      .filter(token => !intentWords.includes(token));
    
    return tokens;
  }

  // Find closest match using Levenshtein distance
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

  // Calculate Levenshtein distance between two strings
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
