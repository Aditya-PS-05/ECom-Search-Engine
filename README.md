# E-Commerce Search Engine

A high-performance search engine for an electronics e-commerce platform targeting Tier-2 and Tier-3 cities in India. Features intelligent ranking, Hinglish query support, and spelling correction.

## Features

- **Intelligent Search**: Fuzzy matching with typo tolerance
- **Hinglish Support**: Understands queries like "sasta phone", "accha mobile"
- **Spelling Correction**: Handles common mistakes ("ifone" → "iphone")
- **Multi-Factor Ranking**: Products ranked by relevance, rating, popularity, price, stock
- **Intent Detection**: Extracts price ranges, colors, storage, brands from queries
- **Fast Performance**: < 100ms response times

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

Server runs at `http://localhost:3000`

## API Endpoints

### Product Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/product` | Create a product |
| GET | `/api/v1/product/:id` | Get product by ID |
| PUT | `/api/v1/product/:id` | Update product |
| DELETE | `/api/v1/product/:id` | Delete product |
| PUT | `/api/v1/product/meta-data` | Update product metadata |
| GET | `/api/v1/products` | List all products (paginated) |
| POST | `/api/v1/products/bulk` | Bulk create products |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search/product?query=...` | Search products |
| GET | `/api/v1/search/suggestions?query=...` | Get autocomplete suggestions |
| GET | `/api/v1/search/trending` | Get trending products |
| GET | `/api/v1/search/category/:category` | Get products by category |

## API Examples

### 1. Create Product

```bash
curl -X POST http://localhost:3000/api/v1/product \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 17",
    "description": "Latest iPhone with A19 chip",
    "rating": 4.2,
    "stock": 1000,
    "price": 81999,
    "mrp": 82999,
    "currency": "Rupee"
  }'
```

Response:
```json
{ "productId": 101 }
```

### 2. Update Metadata

```bash
curl -X PUT http://localhost:3000/api/v1/product/meta-data \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 101,
    "Metadata": {
      "ram": "8GB",
      "screensize": "6.3 inches",
      "model": "iPhone 17",
      "storage": "128GB"
    }
  }'
```

### 3. Search Products

```bash
# Basic search
curl "http://localhost:3000/api/v1/search/product?query=iPhone"

# Hinglish search
curl "http://localhost:3000/api/v1/search/product?query=sasta%20phone"

# With typo
curl "http://localhost:3000/api/v1/search/product?query=ifone%2016"

# Price-based search
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2050k%20rupees"

# Color search
curl "http://localhost:3000/api/v1/search/product?query=iPhone%2016%20red%20color"

# With filters
curl "http://localhost:3000/api/v1/search/product?query=samsung&minPrice=20000&maxPrice=50000&inStock=true"

# With sorting
curl "http://localhost:3000/api/v1/search/product?query=headphones&sortBy=price_asc"
```

## Search Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query (required) |
| `category` | string | Filter by category |
| `brand` | string | Filter by brand |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `minRating` | number | Minimum rating |
| `inStock` | boolean | Only in-stock products |
| `sortBy` | string | Sort order: `relevance`, `price_asc`, `price_desc`, `rating`, `newest`, `popularity`, `discount` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

## Ranking Algorithm

Products are ranked using a weighted multi-factor algorithm:

| Factor | Weight | Description |
|--------|--------|-------------|
| Text Relevance | 35% | How well product matches query (fuzzy matching) |
| Rating Score | 20% | Bayesian average of ratings |
| Popularity | 15% | Based on units sold (logarithmic scale) |
| Price Score | 10% | Discount percentage, value for money |
| Stock Score | 10% | In-stock products ranked higher |
| Recency | 5% | Newer products get slight boost |
| Discount | 5% | Better discounts rank higher |

### Penalties Applied
- Out of stock: -50% of stock score
- High return rate (>5%): Penalty per % above threshold
- Many complaints (>10): Penalty per complaint

### Intent-Based Boosts
- Color match: +15 points
- Storage match: +15 points
- Brand match: +10 points
- Category match: +10 points
- Latest model: +10 points

## Hinglish Support

The search engine understands common Hinglish terms:

| Hinglish | English |
|----------|---------|
| sasta, sastha | cheap, budget |
| mehnga | expensive, premium |
| accha | good, best |
| naya | new, latest |
| bada | big, large |
| chota | small, mini |

## Spelling Correction

Common misspellings are automatically corrected:

| Typo | Corrected |
|------|-----------|
| ifone, iphon | iphone |
| samung, samsang | samsung |
| oneplus, onplus | oneplus |
| redme | redmi |
| airpod | airpods |

## Product Categories

- `phone` - Mobile phones
- `laptop` - Laptops and notebooks
- `headphone` - Headphones, earbuds, TWS
- `accessory` - Cases, chargers, cables
- `smartwatch` - Smartwatches and bands
- `tablet` - Tablets

## Project Structure

```
src/
├── index.ts              # Entry point
├── app.ts                # Express app setup
├── controllers/
│   ├── product.controller.ts
│   └── search.controller.ts
├── services/
│   ├── product.service.ts
│   ├── search.service.ts
│   └── ranking.service.ts
├── models/
│   └── productStore.ts   # In-memory store
├── utils/
│   ├── queryProcessor.ts # Hinglish, spelling, intent
│   └── constants.ts      # Mappings and weights
├── data/
│   └── seedData.ts       # Product generator
├── routes/
│   ├── index.ts
│   ├── product.routes.ts
│   └── search.routes.ts
└── types/
    └── index.ts          # TypeScript interfaces
```

## Performance

- API latency: < 100ms for most queries
- Handles 2600+ products in memory
- Fuzzy search with configurable threshold

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Search**: Fuse.js (fuzzy matching)
- **Data Store**: In-memory (Map)

## License

ISC
