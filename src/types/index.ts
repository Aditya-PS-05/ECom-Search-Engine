export interface ProductMetadata {
  ram?: string;
  storage?: string;
  screenSize?: string;
  color?: string;
  model?: string;
  brand?: string;
  category?: string;
  displayType?: string;
  battery?: string;
  processor?: string;
  camera?: string;
  connectivity?: string;
  material?: string;
  warranty?: string;
  type?: string;
  compatibility?: string;
  waterResistance?: string;
  [key: string]: string | undefined;
}

export interface Product {
  productId: number;
  title: string;
  description: string;
  rating: number;
  ratingCount: number;
  stock: number;
  price: number;
  mrp: number;
  currency: string;
  unitsSold: number;
  returnRate: number;
  complaints: number;
  createdAt: Date;
  metadata: ProductMetadata;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  rating?: number;
  ratingCount?: number;
  stock: number;
  price: number;
  mrp: number;
  currency?: string;
  unitsSold?: number;
  returnRate?: number;
  complaints?: number;
  metadata?: ProductMetadata;
}

export interface UpdateMetadataRequest {
  productId: number;
  Metadata: ProductMetadata;
}

export interface SearchQuery {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity' | 'discount';
  page?: number;
  limit?: number;
  userId?: string; // for personalized ranking (repeat purchase boost)
}

export interface SearchResult {
  productId: number;
  title: string;
  description: string;
  mrp: number;
  Sellingprice: number;
  Metadata: ProductMetadata;
  stock: number;
  rating: number;
  ratingCount: number;
  score?: number;
  repeatPurchaseCount?: number; // how many times user purchased this product
}

export interface QueryIntent {
  originalQuery: string;
  processedQuery: string;
  tokens: string[];
  intents: {
    isCheap: boolean;
    isExpensive: boolean;
    isLatest: boolean;
    priceRange?: { min?: number; max?: number };
    color?: string;
    storage?: string;
    brand?: string;
    category?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
