# E-Commerce Search Engine - Project Plan

## Overview
Build a search engine for an electronics e-commerce platform targeting Tier-2/Tier-3 cities in India with intelligent ranking algorithms.

---

## Phase 1: Project Setup & Data Generation ⏱️ 15 mins

### 1.1 Project Initialization
- [ ] Initialize Node.js/TypeScript project with Express
- [ ] Set up project structure (controllers, services, models, utils)
- [ ] Configure TypeScript, ESLint, and dependencies
- [ ] Set up in-memory data store

### 1.2 Data Generation/Scraping
- [ ] Create data scraper for electronics products (Amazon/Flipkart) OR
- [ ] Generate synthetic dataset with 1000+ products
- [ ] Categories to cover:
  - Mobile phones (iPhone, Samsung, OnePlus, Xiaomi, etc.)
  - Phone accessories (covers, chargers, screen guards)
  - Laptops
  - Headphones/Earbuds
  - Tablets
  - Smartwatches
  - Other gadgets

### 1.3 Product Data Structure
- [ ] Define product entity with:
  - Basic: id, title, description, category, brand
  - Pricing: price, mrp, discount, currency
  - Inventory: stock, stockStatus
  - Metrics: rating, ratingCount, unitsSold, returnRate, complaints
  - Metadata: RAM, storage, screenSize, color, model, etc.

---

## Phase 2: Core API Development ⏱️ 25 mins

### 2.1 Product Management APIs
- [ ] `POST /api/v1/product` - Create product
- [ ] `GET /api/v1/product/:id` - Get product by ID
- [ ] `PUT /api/v1/product/:id` - Update product
- [ ] `DELETE /api/v1/product/:id` - Delete product

### 2.2 Metadata Management
- [ ] `PUT /api/v1/product/meta-data` - Update product metadata
- [ ] `GET /api/v1/product/:id/meta-data` - Get product metadata

### 2.3 Bulk Operations
- [ ] `POST /api/v1/products/bulk` - Bulk insert products
- [ ] `GET /api/v1/products` - List all products with pagination

---

## Phase 3: Search Engine Implementation ⏱️ 35 mins

### 3.1 Text Processing & Query Understanding
- [ ] Implement query preprocessing:
  - Lowercase normalization
  - Hinglish to English translation (sasta → cheap, accha → good)
  - Spelling correction using Levenshtein distance / fuzzy matching
  - Query intent detection (price, color, storage, latest, etc.)
  - Tokenization and stemming

### 3.2 Search Matching Algorithms
- [ ] Implement text matching:
  - TF-IDF based relevance scoring
  - Fuzzy matching for typos (Levenshtein, Jaro-Winkler)
  - N-gram matching for partial matches
  - Exact match boosting

### 3.3 Ranking Algorithm (Core Feature)
- [ ] Multi-factor ranking score calculation:
  ```
  Score = w1*TextRelevance + w2*Rating + w3*Popularity + w4*PriceScore + w5*StockScore + w6*Recency
  ```
- [ ] Factors to consider:
  - **Text Relevance** (0-100): How well product matches query
  - **Rating Score** (0-100): Based on rating and rating count
  - **Popularity Score** (0-100): Units sold, trending factor
  - **Price Score** (0-100): Discount percentage, value for money
  - **Stock Score** (0-100): Availability, out of stock penalty
  - **Recency Score** (0-100): Newer products get boost
  - **Return Rate Penalty**: High return rate lowers score
  - **Complaint Penalty**: More complaints, lower score

### 3.4 Query-Specific Ranking Adjustments
- [ ] Handle special intents:
  - "sasta/cheap" → Prioritize lower prices, higher discounts
  - "latest" → Boost newer models
  - "50k rupees" → Filter by price range
  - "red color" → Filter/boost by color attribute
  - "more storage" → Boost higher storage variants
  - "strong cover" → Boost durability ratings

### 3.5 Search API
- [ ] `GET /api/v1/search/product?query=...` - Main search endpoint
- [ ] Support filters: category, priceRange, brand, rating, inStock
- [ ] Support sorting: relevance, price_asc, price_desc, rating, newest
- [ ] Pagination support

---

## Phase 4: Testing & Optimization ⏱️ 10 mins

### 4.1 Test Cases
- [ ] Test sample queries:
  - "Latest iphone"
  - "Sastha wala iPhone"
  - "Ifone 16"
  - "iPhone 16 red color"
  - "iPhone 16 more storage"
  - "iPhone cover strong"
  - "iPhone 50k rupees"
  - "Samsung phone"
  - "Best headphones under 5000"

### 4.2 Performance Optimization
- [ ] Ensure API latency < 1000ms
- [ ] Implement caching for frequent queries
- [ ] Optimize data structures for search

### 4.3 Error Handling
- [ ] Graceful exception handling
- [ ] Input validation
- [ ] Meaningful error responses

---

## Phase 5: Documentation ⏱️ 5 mins

### 5.1 README
- [ ] Project overview
- [ ] Setup instructions
- [ ] API documentation
- [ ] Ranking algorithm explanation

### 5.2 Code Quality
- [ ] Add comments where necessary
- [ ] Clean, modular code structure
- [ ] Export LLM conversation history

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Framework | Express.js |
| Data Store | In-memory (Map/Array) |
| Search | Custom implementation with fuzzy matching |
| Libraries | fuse.js (fuzzy), natural (NLP), axios (scraping) |

---

## File Structure
```
JumboTail-Test/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express app setup
│   ├── controllers/
│   │   ├── product.controller.ts
│   │   └── search.controller.ts
│   ├── services/
│   │   ├── product.service.ts
│   │   ├── search.service.ts
│   │   └── ranking.service.ts
│   ├── models/
│   │   └── product.model.ts
│   ├── utils/
│   │   ├── queryProcessor.ts    # Hinglish, spelling, intent
│   │   ├── textMatcher.ts       # Fuzzy, TF-IDF
│   │   └── constants.ts
│   ├── data/
│   │   └── seedData.ts          # Generated product data
│   └── types/
│       └── index.ts
├── scripts/
│   └── scraper.ts               # Data scraping script
├── package.json
├── tsconfig.json
├── README.md
├── TODO.md
└── LLM_CONVERSATION.md
```

---

## Ranking Algorithm Details

### Base Score Calculation
```typescript
calculateRankingScore(product, query) {
  const textRelevance = calculateTextRelevance(product, query);     // 40%
  const ratingScore = calculateRatingScore(product);                 // 20%
  const popularityScore = calculatePopularityScore(product);         // 15%
  const priceScore = calculatePriceScore(product, queryIntent);      // 10%
  const stockScore = calculateStockScore(product);                   // 10%
  const recencyScore = calculateRecencyScore(product);               // 5%
  
  let score = (textRelevance * 0.40) +
              (ratingScore * 0.20) +
              (popularityScore * 0.15) +
              (priceScore * 0.10) +
              (stockScore * 0.10) +
              (recencyScore * 0.05);
  
  // Apply penalties
  score -= returnRatePenalty(product);
  score -= complaintPenalty(product);
  
  // Apply query-specific boosts
  score += intentBasedBoost(product, queryIntent);
  
  return score;
}
```

### Hinglish Dictionary
```
sasta, sastha → cheap, budget, low price
mehnga → expensive
accha → good, best
naya → new, latest
purana → old
bada → big, large
chota → small
```

---

## Priority Order
1. ✅ Setup project structure
2. ✅ Generate product data
3. ✅ Implement CRUD APIs
4. ✅ Build search with ranking
5. ✅ Test & optimize
6. ✅ Document

---

**Time Estimate: 90 minutes total**
