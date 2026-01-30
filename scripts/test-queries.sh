#!/bin/bash

# Test script for E-Commerce Search Engine
# Run: chmod +x scripts/test-queries.sh && ./scripts/test-queries.sh

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "E-Commerce Search Engine - Test Queries"
echo "=========================================="
echo ""

# Health check
echo "1. Health Check"
curl -s "$BASE_URL/health" | head -c 200
echo -e "\n"

# Test product count
echo "2. Product Count"
curl -s "$BASE_URL/api/v1/products/count"
echo -e "\n"

# Test categories
echo "3. Categories"
curl -s "$BASE_URL/api/v1/products/categories"
echo -e "\n"

# Test brands
echo "4. Brands (first 10)"
curl -s "$BASE_URL/api/v1/products/brands" | head -c 300
echo -e "\n"

echo "=========================================="
echo "Search Tests"
echo "=========================================="
echo ""

# Test 1: Latest iPhone
echo "5. Search: 'Latest iphone'"
curl -s "$BASE_URL/api/v1/search/product?query=latest%20iphone&limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=latest%20iphone&limit=3"
echo -e "\n"

# Test 2: Hinglish - Sasta iPhone
echo "6. Search: 'Sasta wala iPhone' (Hinglish)"
curl -s "$BASE_URL/api/v1/search/product?query=sasta%20wala%20iphone&limit=3" | jq '.data[0:3] | .[].title, .queryInfo.processedQuery' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=sasta%20wala%20iphone&limit=3"
echo -e "\n"

# Test 3: Spelling mistake
echo "7. Search: 'Ifone 16' (spelling mistake)"
curl -s "$BASE_URL/api/v1/search/product?query=ifone%2016&limit=3" | jq '.data[0:3] | .[].title, .queryInfo.processedQuery' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=ifone%2016&limit=3"
echo -e "\n"

# Test 4: Color search
echo "8. Search: 'iPhone 16 red color'"
curl -s "$BASE_URL/api/v1/search/product?query=iphone%2016%20red%20color&limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=iphone%2016%20red%20color&limit=3"
echo -e "\n"

# Test 5: Storage search
echo "9. Search: 'iPhone 16 more storage'"
curl -s "$BASE_URL/api/v1/search/product?query=iphone%2016%20more%20storage&limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=iphone%2016%20more%20storage&limit=3"
echo -e "\n"

# Test 6: Accessory search
echo "10. Search: 'iPhone cover strong'"
curl -s "$BASE_URL/api/v1/search/product?query=iphone%20cover%20strong&limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=iphone%20cover%20strong&limit=3"
echo -e "\n"

# Test 7: Price search
echo "11. Search: 'iPhone 50k rupees'"
curl -s "$BASE_URL/api/v1/search/product?query=iphone%2050k%20rupees&limit=3" | jq '.data[0:3] | .[] | {title, price: .Sellingprice}' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=iphone%2050k%20rupees&limit=3"
echo -e "\n"

# Test 8: Samsung phone
echo "12. Search: 'Samsung phone'"
curl -s "$BASE_URL/api/v1/search/product?query=samsung%20phone&limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=samsung%20phone&limit=3"
echo -e "\n"

# Test 9: Budget headphones
echo "13. Search: 'headphones under 5000'"
curl -s "$BASE_URL/api/v1/search/product?query=headphones%20under%205000&limit=3" | jq '.data[0:3] | .[] | {title, price: .Sellingprice}' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=headphones%20under%205000&limit=3"
echo -e "\n"

# Test 10: Trending
echo "14. Trending Products"
curl -s "$BASE_URL/api/v1/search/trending?limit=3" | jq '.data[0:3] | .[].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/trending?limit=3"
echo -e "\n"

echo "=========================================="
echo "CRUD Tests"
echo "=========================================="
echo ""

# Create product
echo "15. Create Product"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/product" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product iPhone 99",
    "description": "Test description for iPhone 99",
    "rating": 4.5,
    "stock": 100,
    "price": 99999,
    "mrp": 109999,
    "currency": "Rupee"
  }')
echo "$RESPONSE"
PRODUCT_ID=$(echo "$RESPONSE" | jq -r '.productId' 2>/dev/null || echo "")
echo -e "\n"

# Get product
if [ ! -z "$PRODUCT_ID" ] && [ "$PRODUCT_ID" != "null" ]; then
  echo "16. Get Product (ID: $PRODUCT_ID)"
  curl -s "$BASE_URL/api/v1/product/$PRODUCT_ID" | jq '{title, price, stock}' 2>/dev/null || curl -s "$BASE_URL/api/v1/product/$PRODUCT_ID"
  echo -e "\n"

  # Update metadata
  echo "17. Update Metadata"
  curl -s -X PUT "$BASE_URL/api/v1/product/meta-data" \
    -H "Content-Type: application/json" \
    -d "{
      \"productId\": $PRODUCT_ID,
      \"Metadata\": {
        \"ram\": \"16GB\",
        \"storage\": \"512GB\",
        \"color\": \"Gold\"
      }
    }"
  echo -e "\n"

  # Search for created product
  echo "18. Search for created product"
  curl -s "$BASE_URL/api/v1/search/product?query=iPhone%2099&limit=1" | jq '.data[0].title' 2>/dev/null || curl -s "$BASE_URL/api/v1/search/product?query=iPhone%2099&limit=1"
  echo -e "\n"

  # Delete product
  echo "19. Delete Product"
  curl -s -X DELETE "$BASE_URL/api/v1/product/$PRODUCT_ID"
  echo -e "\n"
fi

echo "=========================================="
echo "Latency Check"
echo "=========================================="
echo ""

echo "20. Search Latency (5 queries)"
for i in {1..5}; do
  START=$(date +%s%N)
  curl -s "$BASE_URL/api/v1/search/product?query=iphone&limit=10" > /dev/null
  END=$(date +%s%N)
  DURATION=$(( (END - START) / 1000000 ))
  echo "Query $i: ${DURATION}ms"
done

echo ""
echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
