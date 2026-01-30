// Hinglish to English mappings for query processing
export const HINGLISH_MAPPINGS: Record<string, string[]> = {
  // Price related
  'sasta': ['cheap', 'budget', 'affordable', 'low price'],
  'sastha': ['cheap', 'budget', 'affordable', 'low price'],
  'mehnga': ['expensive', 'premium', 'high end'],
  'mahenga': ['expensive', 'premium', 'high end'],
  
  // Quality related
  'accha': ['good', 'best', 'quality'],
  'acha': ['good', 'best', 'quality'],
  'bekaar': ['bad', 'poor'],
  'bekar': ['bad', 'poor'],
  
  // Time related
  'naya': ['new', 'latest', 'recent'],
  'naye': ['new', 'latest', 'recent'],
  'purana': ['old', 'previous'],
  
  // Size related
  'bada': ['big', 'large', 'plus', 'max'],
  'badi': ['big', 'large', 'plus', 'max'],
  'chota': ['small', 'mini', 'compact'],
  'choti': ['small', 'mini', 'compact'],
  
  // Other common terms
  'wala': [''],
  'wali': [''],
  'ka': [''],
  'ki': [''],
  'ke': [''],
  'mobile': ['phone', 'smartphone'],
  'phone': ['mobile', 'smartphone'],
};

// Common spelling mistakes mapping
export const SPELLING_CORRECTIONS: Record<string, string> = {
  'ifone': 'iphone',
  'iphon': 'iphone',
  'ipone': 'iphone',
  'aiphone': 'iphone',
  'i phone': 'iphone',
  'samung': 'samsung',
  'samsang': 'samsung',
  'samsun': 'samsung',
  'sumsung': 'samsung',
  'oneplus': 'oneplus',
  'one plus': 'oneplus',
  'onplus': 'oneplus',
  'realmy': 'realme',
  'relme': 'realme',
  'redme': 'redmi',
  'redemy': 'redmi',
  'xaomi': 'xiaomi',
  'xiomi': 'xiaomi',
  'mi': 'xiaomi',
  'opoo': 'oppo',
  'vivo': 'vivo',
  'loptop': 'laptop',
  'laptap': 'laptop',
  'hedphone': 'headphone',
  'headfone': 'headphone',
  'earphone': 'earphone',
  'earpod': 'earpods',
  'airpod': 'airpods',
  'charjer': 'charger',
  'chargr': 'charger',
};

// Color mappings (including Hindi)
export const COLOR_MAPPINGS: Record<string, string> = {
  'lal': 'red',
  'neela': 'blue',
  'nila': 'blue',
  'hara': 'green',
  'peela': 'yellow',
  'kaala': 'black',
  'kala': 'black',
  'safed': 'white',
  'gulabi': 'pink',
  'grey': 'gray',
};

// Storage size patterns
export const STORAGE_PATTERNS = [
  { pattern: /(\d+)\s*gb/i, unit: 'GB' },
  { pattern: /(\d+)\s*tb/i, unit: 'TB' },
];

// Price range patterns
export const PRICE_PATTERNS = [
  { pattern: /under\s*(\d+)k?/i, type: 'max' },
  { pattern: /below\s*(\d+)k?/i, type: 'max' },
  { pattern: /(\d+)k?\s*rupees?/i, type: 'around' },
  { pattern: /(\d+)k?\s*rs\.?/i, type: 'around' },
  { pattern: /budget\s*(\d+)k?/i, type: 'max' },
  { pattern: /(\d+)k?\s*budget/i, type: 'max' },
  { pattern: /(\d+)k?\s*ke\s*andar/i, type: 'max' },
  { pattern: /(\d+)k?\s*tak/i, type: 'max' },
];

// Category keywords
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'phone': ['phone', 'mobile', 'smartphone', 'iphone', 'samsung', 'oneplus', 'xiaomi', 'redmi', 'realme', 'oppo', 'vivo'],
  'laptop': ['laptop', 'notebook', 'macbook', 'chromebook'],
  'headphone': ['headphone', 'earphone', 'earbud', 'airpod', 'earbuds', 'headset', 'tws'],
  'accessory': ['cover', 'case', 'charger', 'cable', 'adapter', 'screen guard', 'tempered glass', 'power bank'],
  'tablet': ['tablet', 'ipad', 'tab'],
  'smartwatch': ['watch', 'smartwatch', 'band', 'fitness band'],
};

// Brand list
export const BRANDS = [
  'apple', 'samsung', 'oneplus', 'xiaomi', 'redmi', 'realme', 'oppo', 'vivo',
  'motorola', 'nokia', 'sony', 'lg', 'google', 'asus', 'lenovo', 'hp', 'dell',
  'acer', 'msi', 'boat', 'jbl', 'bose', 'sennheiser', 'sony', 'skullcandy',
  'anker', 'belkin', 'spigen', 'ringke', 'noise', 'fire-boltt', 'amazfit'
];

// Ranking weights
export const RANKING_WEIGHTS = {
  textRelevance: 0.35,
  rating: 0.20,
  popularity: 0.15,
  price: 0.10,
  stock: 0.10,
  recency: 0.05,
  discount: 0.05,
};

// Penalty factors
export const PENALTY_FACTORS = {
  outOfStock: 0.5,
  highReturnRate: 0.1,  // per 1% return rate above 5%
  complaints: 0.02,      // per complaint above 10
};
