import { CreateProductRequest } from '../types';

// Helper functions for random data generation
const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals: number = 1): number => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const randomElement = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

const randomElements = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Product templates for different categories
const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gold', 'Silver', 'Purple', 'Pink', 'Gray', 'Yellow', 'Orange'];
const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', '32GB'];
const STORAGE_OPTIONS = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];
const SCREEN_SIZES = ['5.5 inches', '6.1 inches', '6.3 inches', '6.5 inches', '6.7 inches', '6.9 inches'];
const LAPTOP_SCREENS = ['13.3 inches', '14 inches', '15.6 inches', '16 inches', '17.3 inches'];
const DISPLAY_TYPES = ['LCD', 'AMOLED', 'Super AMOLED', 'OLED', 'IPS LCD', 'Retina', 'ProMotion OLED'];
const PROCESSORS = ['Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 7 Gen 1', 'A17 Pro', 'A16 Bionic', 'A15 Bionic', 'Dimensity 9200', 'Exynos 2400', 'Tensor G3'];
const LAPTOP_PROCESSORS = ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2', 'Apple M3'];

// Phone models with realistic pricing
const PHONE_MODELS = [
  // Apple iPhones
  { brand: 'Apple', model: 'iPhone 16 Pro Max', basePrice: 144900, baseMrp: 149900 },
  { brand: 'Apple', model: 'iPhone 16 Pro', basePrice: 119900, baseMrp: 124900 },
  { brand: 'Apple', model: 'iPhone 16 Plus', basePrice: 89900, baseMrp: 94900 },
  { brand: 'Apple', model: 'iPhone 16', basePrice: 79900, baseMrp: 84900 },
  { brand: 'Apple', model: 'iPhone 15 Pro Max', basePrice: 134900, baseMrp: 139900 },
  { brand: 'Apple', model: 'iPhone 15 Pro', basePrice: 109900, baseMrp: 114900 },
  { brand: 'Apple', model: 'iPhone 15 Plus', basePrice: 79900, baseMrp: 84900 },
  { brand: 'Apple', model: 'iPhone 15', basePrice: 69900, baseMrp: 74900 },
  { brand: 'Apple', model: 'iPhone 14', basePrice: 59900, baseMrp: 64900 },
  { brand: 'Apple', model: 'iPhone 13', basePrice: 49900, baseMrp: 54900 },
  { brand: 'Apple', model: 'iPhone SE (3rd Gen)', basePrice: 39900, baseMrp: 44900 },
  
  // Samsung
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', basePrice: 134999, baseMrp: 139999 },
  { brand: 'Samsung', model: 'Galaxy S24 Plus', basePrice: 99999, baseMrp: 104999 },
  { brand: 'Samsung', model: 'Galaxy S24', basePrice: 79999, baseMrp: 84999 },
  { brand: 'Samsung', model: 'Galaxy S23 Ultra', basePrice: 114999, baseMrp: 119999 },
  { brand: 'Samsung', model: 'Galaxy S23', basePrice: 69999, baseMrp: 74999 },
  { brand: 'Samsung', model: 'Galaxy Z Fold 5', basePrice: 154999, baseMrp: 164999 },
  { brand: 'Samsung', model: 'Galaxy Z Flip 5', basePrice: 99999, baseMrp: 109999 },
  { brand: 'Samsung', model: 'Galaxy A54', basePrice: 34999, baseMrp: 39999 },
  { brand: 'Samsung', model: 'Galaxy A34', basePrice: 29999, baseMrp: 34999 },
  { brand: 'Samsung', model: 'Galaxy A14', basePrice: 14999, baseMrp: 17999 },
  { brand: 'Samsung', model: 'Galaxy M34', basePrice: 18999, baseMrp: 21999 },
  { brand: 'Samsung', model: 'Galaxy F14', basePrice: 12999, baseMrp: 15999 },
  
  // OnePlus
  { brand: 'OnePlus', model: 'OnePlus 12', basePrice: 64999, baseMrp: 69999 },
  { brand: 'OnePlus', model: 'OnePlus 12R', basePrice: 39999, baseMrp: 44999 },
  { brand: 'OnePlus', model: 'OnePlus 11', basePrice: 54999, baseMrp: 59999 },
  { brand: 'OnePlus', model: 'OnePlus Nord 3', basePrice: 29999, baseMrp: 34999 },
  { brand: 'OnePlus', model: 'OnePlus Nord CE 3', basePrice: 24999, baseMrp: 27999 },
  { brand: 'OnePlus', model: 'OnePlus Nord CE 3 Lite', basePrice: 17999, baseMrp: 19999 },
  
  // Xiaomi/Redmi
  { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', basePrice: 99999, baseMrp: 104999 },
  { brand: 'Xiaomi', model: 'Xiaomi 14', basePrice: 69999, baseMrp: 74999 },
  { brand: 'Xiaomi', model: 'Xiaomi 13 Pro', basePrice: 79999, baseMrp: 84999 },
  { brand: 'Redmi', model: 'Redmi Note 13 Pro Plus', basePrice: 29999, baseMrp: 32999 },
  { brand: 'Redmi', model: 'Redmi Note 13 Pro', basePrice: 24999, baseMrp: 27999 },
  { brand: 'Redmi', model: 'Redmi Note 13', basePrice: 17999, baseMrp: 19999 },
  { brand: 'Redmi', model: 'Redmi 13C', basePrice: 9999, baseMrp: 11999 },
  { brand: 'Redmi', model: 'Redmi 12', basePrice: 10999, baseMrp: 12999 },
  { brand: 'Poco', model: 'Poco X6 Pro', basePrice: 26999, baseMrp: 29999 },
  { brand: 'Poco', model: 'Poco X6', basePrice: 21999, baseMrp: 24999 },
  { brand: 'Poco', model: 'Poco M6 Pro', basePrice: 14999, baseMrp: 16999 },
  
  // Realme
  { brand: 'Realme', model: 'Realme GT 5 Pro', basePrice: 44999, baseMrp: 49999 },
  { brand: 'Realme', model: 'Realme 12 Pro Plus', basePrice: 29999, baseMrp: 32999 },
  { brand: 'Realme', model: 'Realme 12 Pro', basePrice: 24999, baseMrp: 27999 },
  { brand: 'Realme', model: 'Realme Narzo 70 Pro', basePrice: 19999, baseMrp: 22999 },
  { brand: 'Realme', model: 'Realme Narzo 60', basePrice: 14999, baseMrp: 17999 },
  { brand: 'Realme', model: 'Realme C53', basePrice: 9999, baseMrp: 11999 },
  
  // Oppo
  { brand: 'Oppo', model: 'Oppo Find X7 Ultra', basePrice: 89999, baseMrp: 94999 },
  { brand: 'Oppo', model: 'Oppo Reno 11 Pro', basePrice: 39999, baseMrp: 44999 },
  { brand: 'Oppo', model: 'Oppo Reno 11', basePrice: 29999, baseMrp: 32999 },
  { brand: 'Oppo', model: 'Oppo F25 Pro', basePrice: 24999, baseMrp: 27999 },
  { brand: 'Oppo', model: 'Oppo A79', basePrice: 17999, baseMrp: 19999 },
  
  // Vivo
  { brand: 'Vivo', model: 'Vivo X100 Pro', basePrice: 89999, baseMrp: 94999 },
  { brand: 'Vivo', model: 'Vivo X100', basePrice: 64999, baseMrp: 69999 },
  { brand: 'Vivo', model: 'Vivo V30 Pro', basePrice: 39999, baseMrp: 44999 },
  { brand: 'Vivo', model: 'Vivo V30', basePrice: 29999, baseMrp: 34999 },
  { brand: 'Vivo', model: 'Vivo Y100', basePrice: 19999, baseMrp: 22999 },
  { brand: 'Vivo', model: 'Vivo Y56', basePrice: 14999, baseMrp: 17999 },
  
  // Motorola
  { brand: 'Motorola', model: 'Motorola Edge 50 Pro', basePrice: 34999, baseMrp: 39999 },
  { brand: 'Motorola', model: 'Motorola Edge 40 Neo', basePrice: 24999, baseMrp: 27999 },
  { brand: 'Motorola', model: 'Moto G84', basePrice: 17999, baseMrp: 19999 },
  { brand: 'Motorola', model: 'Moto G54', basePrice: 14999, baseMrp: 16999 },
  
  // Nokia
  { brand: 'Nokia', model: 'Nokia G42', basePrice: 13999, baseMrp: 15999 },
  { brand: 'Nokia', model: 'Nokia C32', basePrice: 8999, baseMrp: 10999 },
  
  // Google
  { brand: 'Google', model: 'Pixel 8 Pro', basePrice: 99999, baseMrp: 106999 },
  { brand: 'Google', model: 'Pixel 8', basePrice: 75999, baseMrp: 79999 },
  { brand: 'Google', model: 'Pixel 8a', basePrice: 52999, baseMrp: 55999 },
  { brand: 'Google', model: 'Pixel 7a', basePrice: 39999, baseMrp: 43999 },
];

// Laptop models
const LAPTOP_MODELS = [
  { brand: 'Apple', model: 'MacBook Air M3', basePrice: 114900, baseMrp: 119900 },
  { brand: 'Apple', model: 'MacBook Air M2', basePrice: 99900, baseMrp: 104900 },
  { brand: 'Apple', model: 'MacBook Pro 14 M3 Pro', basePrice: 199900, baseMrp: 209900 },
  { brand: 'Apple', model: 'MacBook Pro 16 M3 Max', basePrice: 349900, baseMrp: 359900 },
  { brand: 'HP', model: 'HP Pavilion 15', basePrice: 54999, baseMrp: 59999 },
  { brand: 'HP', model: 'HP Victus Gaming', basePrice: 69999, baseMrp: 79999 },
  { brand: 'HP', model: 'HP Envy x360', basePrice: 84999, baseMrp: 94999 },
  { brand: 'HP', model: 'HP 15s', basePrice: 42999, baseMrp: 47999 },
  { brand: 'Dell', model: 'Dell XPS 15', basePrice: 149999, baseMrp: 159999 },
  { brand: 'Dell', model: 'Dell Inspiron 15', basePrice: 49999, baseMrp: 54999 },
  { brand: 'Dell', model: 'Dell G15 Gaming', basePrice: 79999, baseMrp: 89999 },
  { brand: 'Dell', model: 'Dell Vostro 15', basePrice: 44999, baseMrp: 49999 },
  { brand: 'Lenovo', model: 'Lenovo ThinkPad X1 Carbon', basePrice: 159999, baseMrp: 174999 },
  { brand: 'Lenovo', model: 'Lenovo IdeaPad Slim 5', basePrice: 59999, baseMrp: 64999 },
  { brand: 'Lenovo', model: 'Lenovo Legion 5', basePrice: 89999, baseMrp: 99999 },
  { brand: 'Lenovo', model: 'Lenovo IdeaPad Gaming 3', basePrice: 64999, baseMrp: 74999 },
  { brand: 'Asus', model: 'Asus ROG Strix G16', basePrice: 124999, baseMrp: 134999 },
  { brand: 'Asus', model: 'Asus TUF Gaming A15', basePrice: 74999, baseMrp: 84999 },
  { brand: 'Asus', model: 'Asus VivoBook 15', basePrice: 44999, baseMrp: 49999 },
  { brand: 'Acer', model: 'Acer Nitro 5', basePrice: 59999, baseMrp: 69999 },
  { brand: 'Acer', model: 'Acer Aspire 5', basePrice: 39999, baseMrp: 44999 },
  { brand: 'MSI', model: 'MSI Katana 15', basePrice: 84999, baseMrp: 94999 },
  { brand: 'MSI', model: 'MSI Modern 14', basePrice: 54999, baseMrp: 59999 },
];

// Headphone models
const HEADPHONE_MODELS = [
  { brand: 'Apple', model: 'AirPods Pro 2nd Gen', basePrice: 24900, baseMrp: 26900, type: 'TWS' },
  { brand: 'Apple', model: 'AirPods 3rd Gen', basePrice: 18900, baseMrp: 20900, type: 'TWS' },
  { brand: 'Apple', model: 'AirPods Max', basePrice: 59900, baseMrp: 64900, type: 'Over-ear' },
  { brand: 'Samsung', model: 'Galaxy Buds2 Pro', basePrice: 14999, baseMrp: 17999, type: 'TWS' },
  { brand: 'Samsung', model: 'Galaxy Buds FE', basePrice: 6999, baseMrp: 8999, type: 'TWS' },
  { brand: 'Sony', model: 'WH-1000XM5', basePrice: 29990, baseMrp: 34990, type: 'Over-ear' },
  { brand: 'Sony', model: 'WH-1000XM4', basePrice: 24990, baseMrp: 29990, type: 'Over-ear' },
  { brand: 'Sony', model: 'WF-1000XM5', basePrice: 24990, baseMrp: 27990, type: 'TWS' },
  { brand: 'Sony', model: 'LinkBuds S', basePrice: 14990, baseMrp: 17990, type: 'TWS' },
  { brand: 'JBL', model: 'JBL Tune 770NC', basePrice: 7999, baseMrp: 9999, type: 'Over-ear' },
  { brand: 'JBL', model: 'JBL Live Pro 2', basePrice: 12999, baseMrp: 14999, type: 'TWS' },
  { brand: 'JBL', model: 'JBL Tune Buds', basePrice: 4999, baseMrp: 5999, type: 'TWS' },
  { brand: 'JBL', model: 'JBL Wave 200', basePrice: 2999, baseMrp: 3499, type: 'TWS' },
  { brand: 'Boat', model: 'boAt Airdopes 141', basePrice: 1299, baseMrp: 2499, type: 'TWS' },
  { brand: 'Boat', model: 'boAt Airdopes 161', basePrice: 1499, baseMrp: 2999, type: 'TWS' },
  { brand: 'Boat', model: 'boAt Rockerz 450', basePrice: 1499, baseMrp: 2999, type: 'On-ear' },
  { brand: 'Boat', model: 'boAt Rockerz 550', basePrice: 1799, baseMrp: 3499, type: 'Over-ear' },
  { brand: 'Boat', model: 'boAt Nirvana 751 ANC', basePrice: 2999, baseMrp: 5999, type: 'Over-ear' },
  { brand: 'Noise', model: 'Noise Buds VS104', basePrice: 1299, baseMrp: 2499, type: 'TWS' },
  { brand: 'Noise', model: 'Noise Air Buds Pro', basePrice: 2499, baseMrp: 4999, type: 'TWS' },
  { brand: 'OnePlus', model: 'OnePlus Buds Pro 2', basePrice: 9999, baseMrp: 11999, type: 'TWS' },
  { brand: 'OnePlus', model: 'OnePlus Buds 3', basePrice: 5499, baseMrp: 6999, type: 'TWS' },
  { brand: 'OnePlus', model: 'OnePlus Nord Buds 2', basePrice: 2999, baseMrp: 3499, type: 'TWS' },
  { brand: 'Bose', model: 'Bose QuietComfort Ultra', basePrice: 34900, baseMrp: 39900, type: 'Over-ear' },
  { brand: 'Bose', model: 'Bose QuietComfort 45', basePrice: 27900, baseMrp: 32900, type: 'Over-ear' },
  { brand: 'Sennheiser', model: 'Sennheiser Momentum 4', basePrice: 29990, baseMrp: 34990, type: 'Over-ear' },
  { brand: 'Sennheiser', model: 'Sennheiser HD 450BT', basePrice: 12990, baseMrp: 14990, type: 'Over-ear' },
];

// Accessories
const ACCESSORY_TEMPLATES = [
  { type: 'cover', name: 'Mobile Cover', priceRange: [199, 1999] },
  { type: 'cover', name: 'Back Case', priceRange: [299, 2499] },
  { type: 'cover', name: 'Flip Cover', priceRange: [399, 1499] },
  { type: 'cover', name: 'Bumper Case', priceRange: [349, 999] },
  { type: 'cover', name: 'Rugged Armor Case', priceRange: [499, 2499] },
  { type: 'screen', name: 'Tempered Glass', priceRange: [149, 999] },
  { type: 'screen', name: 'Screen Protector', priceRange: [99, 599] },
  { type: 'screen', name: 'Privacy Screen Guard', priceRange: [299, 1499] },
  { type: 'charger', name: 'Fast Charger', priceRange: [499, 2999] },
  { type: 'charger', name: 'Wireless Charger', priceRange: [999, 4999] },
  { type: 'charger', name: 'Car Charger', priceRange: [399, 1999] },
  { type: 'charger', name: 'GaN Charger 65W', priceRange: [1499, 3999] },
  { type: 'cable', name: 'USB-C Cable', priceRange: [199, 999] },
  { type: 'cable', name: 'Lightning Cable', priceRange: [299, 1499] },
  { type: 'cable', name: 'Braided Charging Cable', priceRange: [349, 1299] },
  { type: 'powerbank', name: 'Power Bank 10000mAh', priceRange: [799, 2499] },
  { type: 'powerbank', name: 'Power Bank 20000mAh', priceRange: [1299, 3999] },
  { type: 'powerbank', name: 'Power Bank 30000mAh', priceRange: [1999, 4999] },
];

const ACCESSORY_BRANDS = ['Spigen', 'Ringke', 'ESR', 'Caseology', 'OtterBox', 'UAG', 'Belkin', 'Anker', 'MI', 'Ambrane', 'pTron', 'Portronics'];

// Smartwatch models
const SMARTWATCH_MODELS = [
  { brand: 'Apple', model: 'Apple Watch Ultra 2', basePrice: 89900, baseMrp: 94900 },
  { brand: 'Apple', model: 'Apple Watch Series 9', basePrice: 44900, baseMrp: 49900 },
  { brand: 'Apple', model: 'Apple Watch SE', basePrice: 29900, baseMrp: 32900 },
  { brand: 'Samsung', model: 'Galaxy Watch 6 Classic', basePrice: 34999, baseMrp: 39999 },
  { brand: 'Samsung', model: 'Galaxy Watch 6', basePrice: 27999, baseMrp: 32999 },
  { brand: 'Samsung', model: 'Galaxy Watch FE', basePrice: 19999, baseMrp: 24999 },
  { brand: 'Garmin', model: 'Garmin Fenix 7', basePrice: 69990, baseMrp: 79990 },
  { brand: 'Garmin', model: 'Garmin Venu 3', basePrice: 49990, baseMrp: 54990 },
  { brand: 'Amazfit', model: 'Amazfit GTR 4', basePrice: 14999, baseMrp: 17999 },
  { brand: 'Amazfit', model: 'Amazfit GTS 4 Mini', basePrice: 8999, baseMrp: 10999 },
  { brand: 'Noise', model: 'Noise ColorFit Pro 5', basePrice: 4999, baseMrp: 6999 },
  { brand: 'Noise', model: 'Noise Pulse 2 Max', basePrice: 2499, baseMrp: 3999 },
  { brand: 'Fire-Boltt', model: 'Fire-Boltt Phoenix Ultra', basePrice: 2999, baseMrp: 5999 },
  { brand: 'Fire-Boltt', model: 'Fire-Boltt Ninja Call Pro', basePrice: 1799, baseMrp: 3999 },
  { brand: 'Boat', model: 'boAt Wave Lynk', basePrice: 1999, baseMrp: 3999 },
  { brand: 'Boat', model: 'boAt Xtend Plus', basePrice: 2499, baseMrp: 4999 },
];

// Tablet models
const TABLET_MODELS = [
  { brand: 'Apple', model: 'iPad Pro 12.9 M2', basePrice: 112900, baseMrp: 119900 },
  { brand: 'Apple', model: 'iPad Pro 11 M2', basePrice: 81900, baseMrp: 87900 },
  { brand: 'Apple', model: 'iPad Air M1', basePrice: 59900, baseMrp: 64900 },
  { brand: 'Apple', model: 'iPad 10th Gen', basePrice: 44900, baseMrp: 49900 },
  { brand: 'Apple', model: 'iPad Mini 6th Gen', basePrice: 49900, baseMrp: 54900 },
  { brand: 'Samsung', model: 'Galaxy Tab S9 Ultra', basePrice: 108999, baseMrp: 119999 },
  { brand: 'Samsung', model: 'Galaxy Tab S9 Plus', basePrice: 83999, baseMrp: 94999 },
  { brand: 'Samsung', model: 'Galaxy Tab S9', basePrice: 68999, baseMrp: 79999 },
  { brand: 'Samsung', model: 'Galaxy Tab A9 Plus', basePrice: 21999, baseMrp: 26999 },
  { brand: 'Samsung', model: 'Galaxy Tab A9', basePrice: 13999, baseMrp: 16999 },
  { brand: 'Lenovo', model: 'Lenovo Tab P12 Pro', basePrice: 49999, baseMrp: 54999 },
  { brand: 'Lenovo', model: 'Lenovo Tab M10', basePrice: 14999, baseMrp: 17999 },
  { brand: 'Xiaomi', model: 'Xiaomi Pad 6', basePrice: 26999, baseMrp: 29999 },
  { brand: 'OnePlus', model: 'OnePlus Pad', basePrice: 37999, baseMrp: 42999 },
  { brand: 'Realme', model: 'Realme Pad 2', basePrice: 17999, baseMrp: 19999 },
];

// Generate phone products
function generatePhoneProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  
  for (const phone of PHONE_MODELS) {
    const storageVariants = phone.basePrice > 50000 
      ? ['128GB', '256GB', '512GB', '1TB'] 
      : ['64GB', '128GB', '256GB'];
    
    const colorVariants = randomElements(COLORS, randomInt(3, 6));
    
    for (const storage of storageVariants) {
      for (const color of colorVariants) {
        const storageMultiplier = storage === '64GB' ? 0.9 : storage === '128GB' ? 1 : storage === '256GB' ? 1.12 : storage === '512GB' ? 1.25 : 1.4;
        const price = Math.round(phone.basePrice * storageMultiplier);
        const mrp = Math.round(phone.baseMrp * storageMultiplier);
        const ram = phone.basePrice > 80000 ? randomElement(['8GB', '12GB', '16GB']) : 
                   phone.basePrice > 40000 ? randomElement(['6GB', '8GB', '12GB']) : 
                   randomElement(['4GB', '6GB', '8GB']);
        
        products.push({
          title: `${phone.model} ${storage} ${color}`,
          description: `${phone.brand} ${phone.model} with ${storage} storage and ${ram} RAM in stunning ${color} color. Features ${randomElement(DISPLAY_TYPES)} display, ${randomElement(PROCESSORS)} processor, and premium build quality.`,
          rating: randomFloat(3.5, 5, 1),
          ratingCount: randomInt(100, 50000),
          stock: randomInt(0, 500),
          price: price,
          mrp: mrp,
          currency: 'Rupee',
          unitsSold: randomInt(50, 100000),
          returnRate: randomFloat(0.5, 8, 1),
          complaints: randomInt(0, 50),
          metadata: {
            brand: phone.brand,
            model: phone.model,
            category: 'phone',
            ram: ram,
            storage: storage,
            color: color,
            screenSize: randomElement(SCREEN_SIZES),
            displayType: randomElement(DISPLAY_TYPES),
            processor: phone.brand === 'Apple' ? randomElement(['A17 Pro', 'A16 Bionic', 'A15 Bionic']) : randomElement(PROCESSORS),
            battery: `${randomInt(3500, 5500)}mAh`,
            camera: phone.basePrice > 80000 ? '48MP + 12MP + 12MP' : phone.basePrice > 40000 ? '50MP + 8MP' : '48MP + 2MP',
            connectivity: '5G',
            warranty: '1 Year Manufacturer Warranty',
          }
        });
      }
    }
  }
  
  return products;
}

// Generate laptop products
function generateLaptopProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  
  for (const laptop of LAPTOP_MODELS) {
    const ramVariants = laptop.basePrice > 100000 ? ['16GB', '32GB', '64GB'] : ['8GB', '16GB', '32GB'];
    const storageVariants = ['256GB SSD', '512GB SSD', '1TB SSD'];
    const colorVariants = randomElements(['Silver', 'Space Gray', 'Black', 'White', 'Blue'], randomInt(2, 3));
    
    for (const ram of ramVariants) {
      for (const storage of storageVariants) {
        const color = randomElement(colorVariants);
        const ramMultiplier = ram === '8GB' ? 0.95 : ram === '16GB' ? 1 : ram === '32GB' ? 1.15 : 1.35;
        const storageMultiplier = storage === '256GB SSD' ? 0.95 : storage === '512GB SSD' ? 1 : 1.1;
        const price = Math.round(laptop.basePrice * ramMultiplier * storageMultiplier);
        const mrp = Math.round(laptop.baseMrp * ramMultiplier * storageMultiplier);
        
        products.push({
          title: `${laptop.model} ${ram} ${storage} ${color}`,
          description: `${laptop.brand} ${laptop.model} featuring ${ram} RAM and ${storage} storage. Perfect for work and entertainment with ${randomElement(LAPTOP_SCREENS)} display.`,
          rating: randomFloat(3.8, 4.9, 1),
          ratingCount: randomInt(50, 10000),
          stock: randomInt(0, 100),
          price: price,
          mrp: mrp,
          currency: 'Rupee',
          unitsSold: randomInt(20, 5000),
          returnRate: randomFloat(1, 6, 1),
          complaints: randomInt(0, 20),
          metadata: {
            brand: laptop.brand,
            model: laptop.model,
            category: 'laptop',
            ram: ram,
            storage: storage,
            color: color,
            screenSize: randomElement(LAPTOP_SCREENS),
            displayType: laptop.brand === 'Apple' ? 'Retina' : randomElement(['IPS', 'OLED', 'LED']),
            processor: laptop.brand === 'Apple' ? randomElement(['Apple M1', 'Apple M2', 'Apple M3']) : randomElement(LAPTOP_PROCESSORS),
            battery: `${randomInt(50, 100)}Wh`,
            connectivity: 'WiFi 6, Bluetooth 5.0',
            warranty: '1 Year Manufacturer Warranty',
          }
        });
      }
    }
  }
  
  return products;
}

// Generate headphone products
function generateHeadphoneProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  
  for (const headphone of HEADPHONE_MODELS) {
    const colorVariants = randomElements(COLORS, randomInt(2, 4));
    
    for (const color of colorVariants) {
      const priceVariation = randomFloat(0.95, 1.05, 2);
      const price = Math.round(headphone.basePrice * priceVariation);
      const mrp = Math.round(headphone.baseMrp * priceVariation);
      
      products.push({
        title: `${headphone.model} ${color}`,
        description: `${headphone.brand} ${headphone.model} ${headphone.type} in ${color}. Premium sound quality with active noise cancellation and long battery life.`,
        rating: randomFloat(3.5, 4.9, 1),
        ratingCount: randomInt(100, 30000),
        stock: randomInt(0, 300),
        price: price,
        mrp: mrp,
        currency: 'Rupee',
        unitsSold: randomInt(100, 50000),
        returnRate: randomFloat(1, 5, 1),
        complaints: randomInt(0, 30),
        metadata: {
          brand: headphone.brand,
          model: headphone.model,
          category: 'headphone',
          type: headphone.type,
          color: color,
          connectivity: 'Bluetooth 5.0',
          battery: `${randomInt(20, 60)} hours`,
          warranty: '1 Year Manufacturer Warranty',
        }
      });
    }
  }
  
  return products;
}

// Generate accessory products
function generateAccessoryProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  const phoneModelsForAccessories = PHONE_MODELS.filter(p => p.basePrice > 30000).slice(0, 30);
  
  for (const phone of phoneModelsForAccessories) {
    for (const accessory of ACCESSORY_TEMPLATES) {
      const colorVariants = accessory.type === 'cover' || accessory.type === 'cable' 
        ? randomElements(COLORS, randomInt(2, 5)) 
        : ['Black'];
      
      for (const color of colorVariants) {
        const brand = randomElement(ACCESSORY_BRANDS);
        const price = randomInt(accessory.priceRange[0], accessory.priceRange[1]);
        const mrp = Math.round(price * randomFloat(1.2, 1.8, 2));
        
        let title = `${brand} ${accessory.name} for ${phone.model}`;
        if (color !== 'Black' && accessory.type === 'cover') {
          title += ` - ${color}`;
        }
        
        const features = accessory.type === 'cover' 
          ? 'Shock-proof, anti-scratch, precise cutouts, slim fit design'
          : accessory.type === 'charger'
          ? 'Fast charging, overheat protection, compact design'
          : accessory.type === 'powerbank'
          ? 'Fast charging, multiple ports, LED indicator'
          : 'Durable, high quality materials';
        
        products.push({
          title: title,
          description: `Premium ${accessory.name.toLowerCase()} designed specifically for ${phone.model}. ${features}.`,
          rating: randomFloat(3.0, 4.8, 1),
          ratingCount: randomInt(50, 20000),
          stock: randomInt(0, 1000),
          price: price,
          mrp: mrp,
          currency: 'Rupee',
          unitsSold: randomInt(100, 30000),
          returnRate: randomFloat(2, 10, 1),
          complaints: randomInt(0, 40),
          metadata: {
            brand: brand,
            model: phone.model,
            category: 'accessory',
            type: accessory.type,
            color: color,
            compatibility: phone.model,
            material: accessory.type === 'cover' ? randomElement(['TPU', 'Silicone', 'Polycarbonate', 'Leather']) : undefined,
            warranty: '6 Months Warranty',
          }
        });
      }
    }
  }
  
  return products;
}

// Generate smartwatch products
function generateSmartwatchProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  
  for (const watch of SMARTWATCH_MODELS) {
    const colorVariants = randomElements(['Black', 'Silver', 'Gold', 'Blue', 'Green', 'Pink'], randomInt(2, 4));
    
    for (const color of colorVariants) {
      const priceVariation = randomFloat(0.95, 1.05, 2);
      const price = Math.round(watch.basePrice * priceVariation);
      const mrp = Math.round(watch.baseMrp * priceVariation);
      
      products.push({
        title: `${watch.model} ${color}`,
        description: `${watch.brand} ${watch.model} smartwatch in ${color}. Features health monitoring, GPS, water resistance, and long battery life.`,
        rating: randomFloat(3.5, 4.8, 1),
        ratingCount: randomInt(100, 15000),
        stock: randomInt(0, 200),
        price: price,
        mrp: mrp,
        currency: 'Rupee',
        unitsSold: randomInt(50, 20000),
        returnRate: randomFloat(2, 7, 1),
        complaints: randomInt(0, 25),
        metadata: {
          brand: watch.brand,
          model: watch.model,
          category: 'smartwatch',
          color: color,
          displayType: watch.basePrice > 30000 ? 'AMOLED' : randomElement(['AMOLED', 'LCD', 'TFT']),
          battery: `${randomInt(2, 14)} days`,
          connectivity: 'Bluetooth, GPS',
          waterResistance: watch.basePrice > 20000 ? '5ATM' : 'IP68',
          warranty: '1 Year Manufacturer Warranty',
        }
      });
    }
  }
  
  return products;
}

// Generate tablet products
function generateTabletProducts(): CreateProductRequest[] {
  const products: CreateProductRequest[] = [];
  
  for (const tablet of TABLET_MODELS) {
    const storageVariants = tablet.basePrice > 50000 ? ['128GB', '256GB', '512GB', '1TB'] : ['64GB', '128GB', '256GB'];
    const colorVariants = randomElements(['Space Gray', 'Silver', 'Blue', 'Pink', 'Purple'], randomInt(2, 3));
    
    for (const storage of storageVariants) {
      for (const color of colorVariants) {
        const storageMultiplier = storage === '64GB' ? 0.9 : storage === '128GB' ? 1 : storage === '256GB' ? 1.1 : storage === '512GB' ? 1.2 : 1.35;
        const price = Math.round(tablet.basePrice * storageMultiplier);
        const mrp = Math.round(tablet.baseMrp * storageMultiplier);
        
        products.push({
          title: `${tablet.model} ${storage} WiFi ${color}`,
          description: `${tablet.brand} ${tablet.model} with ${storage} storage in ${color}. Perfect for productivity, entertainment, and creativity.`,
          rating: randomFloat(4.0, 4.9, 1),
          ratingCount: randomInt(50, 8000),
          stock: randomInt(0, 80),
          price: price,
          mrp: mrp,
          currency: 'Rupee',
          unitsSold: randomInt(30, 3000),
          returnRate: randomFloat(1, 5, 1),
          complaints: randomInt(0, 15),
          metadata: {
            brand: tablet.brand,
            model: tablet.model,
            category: 'tablet',
            storage: storage,
            color: color,
            screenSize: tablet.brand === 'Apple' ? randomElement(['10.9 inches', '11 inches', '12.9 inches']) : randomElement(['10.4 inches', '11 inches', '12.4 inches', '14.6 inches']),
            displayType: tablet.basePrice > 40000 ? 'Liquid Retina' : randomElement(['IPS LCD', 'AMOLED']),
            connectivity: 'WiFi 6',
            warranty: '1 Year Manufacturer Warranty',
          }
        });
      }
    }
  }
  
  return products;
}

// Main function to generate all products
export function generateAllProducts(): CreateProductRequest[] {
  const phones = generatePhoneProducts();
  const laptops = generateLaptopProducts();
  const headphones = generateHeadphoneProducts();
  const accessories = generateAccessoryProducts();
  const smartwatches = generateSmartwatchProducts();
  const tablets = generateTabletProducts();
  
  const allProducts = [
    ...phones,
    ...laptops,
    ...headphones,
    ...accessories,
    ...smartwatches,
    ...tablets,
  ];
  
  console.log(`Generated products breakdown:
    - Phones: ${phones.length}
    - Laptops: ${laptops.length}
    - Headphones: ${headphones.length}
    - Accessories: ${accessories.length}
    - Smartwatches: ${smartwatches.length}
    - Tablets: ${tablets.length}
    - Total: ${allProducts.length}
  `);
  
  return allProducts;
}
