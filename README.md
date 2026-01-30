# E-Commerce Search Engine

Search engine for an electronics e-commerce platform. Built for the JumboTail assessment.

## What it does

- Searches products with fuzzy matching (handles typos)
- Understands Hinglish queries like "sasta phone" or "accha mobile"  
- Ranks results based on ratings, popularity, price, stock etc
- Scrapes products from Flipkart and Amazon

## How to run 
> scrapper will be automatically run and will be used. 

```bash
npm install
npm run dev
```

Server starts at http://localhost:3000

To run without background scraping:
```bash
ENABLE_SCRAPING=false npm run dev
```

To use SQLite database instead of in-memory:
```bash
USE_DB=true npm run dev
```

To just run the scraper:
```bash
npm run scrape
```

## LLM Conversation
https://ampcode.com/threads/T-019c0f19-1395-77f2-8596-1b4867b51c3a
https://ampcode.com/threads/T-019c0ef2-2628-7459-a274-01c01e37e0b9

## APIs

### Create Product
```
POST /api/v1/product
```
```json
{
  "title": "iPhone 17",
  "description": "Latest iPhone with A19 chip",
  "rating": 4.2,
  "stock": 1000,
  "price": 81999,
  "mrp": 82999,
  "currency": "Rupee"
}
```

### Update Metadata
```
PUT /api/v1/product/meta-data
```
```json
{
  "productId": 101,
  "Metadata": {
    "ram": "8GB",
    "storage": "128GB",
    "color": "Black"
  }
}
```

### Search Products
```
GET /api/v1/search/product?query=sasta%20iphone
```

Query params:
- `query` - search text
- `minPrice`, `maxPrice` - price range
- `brand` - filter by brand
- `category` - filter by category
- `inStock` - only show in-stock items
- `sortBy` - relevance, price_asc, price_desc, rating, popularity

## Sample queries that work

- `iphone` - basic search
- `sasta phone` - hinglish for cheap phone
- `ifone 16` - typo correction
- `iphone 50k rupees` - price intent
- `samsung red color` - color filter
- `laptop gaming` - category search

## How ranking works

Products are scored based on:
- Text relevance (how well title/description matches query)
- Rating (uses bayesian average so products with few ratings dont dominate)
- Popularity (units sold, log scale)
- Stock availability
- Price/discount

Penalties applied for:
- Out of stock products
- High return rate
- Too many complaints


## Tech used

- Node.js + TypeScript
- Express
- Fuse.js for fuzzy search
- Cheerio + Axios for scraping

## Notes

- Database: in-memory storage (fast, no setup) and SQLite database with USE_DB=true (persists across restarts)
- Scraper runs in background on startup
- Scraped data saved to JSON for next restart
- All APIs respond in under 100ms
