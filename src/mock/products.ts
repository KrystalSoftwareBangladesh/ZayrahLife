export interface ProductVariant {
  id: number
  color: string
  size: string | null
  price: number
  originalPrice: number | null
  stock: number
  sku: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  originalPrice: number | null
  category: string
  categoryName: string
  images: string[]
  colors: string[] | null
  sizes: string[] | null
  stock: number
  featured: boolean
  rating: number
  reviewCount: number
  variants: ProductVariant[]
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Classic White T-Shirt',
    slug: 'classic-white-tshirt',
    description: 'Premium cotton t-shirt with a comfortable fit. Perfect for everyday wear.',
    price: 29.99,
    originalPrice: 39.99,
    category: 'clothing',
    categoryName: 'Clothing',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=500'
    ],
    colors: ['White', 'Black', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 25,
    featured: true,
    rating: 4.5,
    reviewCount: 128,
    variants: [
      { id: 101, color: 'White', size: 'S', price: 29.99, originalPrice: 39.99, stock: 5, sku: 'TSH-001-WHT-S' },
      { id: 102, color: 'White', size: 'M', price: 29.99, originalPrice: 39.99, stock: 8, sku: 'TSH-001-WHT-M' },
      { id: 103, color: 'White', size: 'L', price: 29.99, originalPrice: 39.99, stock: 6, sku: 'TSH-001-WHT-L' },
      { id: 104, color: 'White', size: 'XL', price: 29.99, originalPrice: 39.99, stock: 3, sku: 'TSH-001-WHT-XL' },
      { id: 105, color: 'Black', size: 'S', price: 29.99, originalPrice: 39.99, stock: 4, sku: 'TSH-001-BLK-S' },
      { id: 106, color: 'Black', size: 'M', price: 29.99, originalPrice: 39.99, stock: 0, sku: 'TSH-001-BLK-M' },
      { id: 107, color: 'Black', size: 'L', price: 29.99, originalPrice: 39.99, stock: 7, sku: 'TSH-001-BLK-L' },
      { id: 108, color: 'Black', size: 'XL', price: 32.99, originalPrice: 42.99, stock: 2, sku: 'TSH-001-BLK-XL' },
      { id: 109, color: 'Gray', size: 'S', price: 27.99, originalPrice: 37.99, stock: 3, sku: 'TSH-001-GRY-S' },
      { id: 110, color: 'Gray', size: 'M', price: 27.99, originalPrice: 37.99, stock: 5, sku: 'TSH-001-GRY-M' },
      { id: 111, color: 'Gray', size: 'L', price: 27.99, originalPrice: 37.99, stock: 4, sku: 'TSH-001-GRY-L' },
      { id: 112, color: 'Gray', size: 'XL', price: 30.99, originalPrice: 40.99, stock: 1, sku: 'TSH-001-GRY-XL' }
    ]
  },
  {
    id: 2,
    name: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    description: 'Elegant genuine leather crossbody bag with adjustable strap.',
    price: 89.99,
    originalPrice: null,
    category: 'accessories',
    categoryName: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500'
    ],
    colors: ['Brown', 'Black', 'Tan'],
    sizes: null,
    stock: 12,
    featured: true,
    rating: 4.8,
    reviewCount: 89,
    variants: [
      { id: 201, color: 'Brown', size: null, price: 89.99, originalPrice: null, stock: 5, sku: 'BAG-002-BRN' },
      { id: 202, color: 'Black', size: null, price: 89.99, originalPrice: null, stock: 4, sku: 'BAG-002-BLK' },
      { id: 203, color: 'Tan', size: null, price: 94.99, originalPrice: 109.99, stock: 3, sku: 'BAG-002-TAN' }
    ]
  },
  {
    id: 3,
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 149.99,
    originalPrice: 199.99,
    category: 'electronics',
    categoryName: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'
    ],
    colors: ['Black', 'White', 'Blue'],
    sizes: null,
    stock: 8,
    featured: true,
    rating: 4.7,
    reviewCount: 256,
    variants: [
      { id: 301, color: 'Black', size: null, price: 149.99, originalPrice: 199.99, stock: 3, sku: 'HPH-003-BLK' },
      { id: 302, color: 'White', size: null, price: 149.99, originalPrice: 199.99, stock: 3, sku: 'HPH-003-WHT' },
      { id: 303, color: 'Blue', size: null, price: 159.99, originalPrice: 209.99, stock: 2, sku: 'HPH-003-BLU' }
    ]
  },
  {
    id: 4,
    name: 'Running Sneakers',
    slug: 'running-sneakers',
    description: 'Lightweight running shoes with superior cushioning and breathable mesh.',
    price: 119.99,
    originalPrice: null,
    category: 'footwear',
    categoryName: 'Footwear',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500'
    ],
    colors: ['Red', 'Black', 'White'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    stock: 15,
    featured: false,
    rating: 4.6,
    reviewCount: 178,
    variants: [
      { id: 401, color: 'Red', size: '7', price: 119.99, originalPrice: null, stock: 2, sku: 'SNK-004-RED-7' },
      { id: 402, color: 'Red', size: '8', price: 119.99, originalPrice: null, stock: 3, sku: 'SNK-004-RED-8' },
      { id: 403, color: 'Red', size: '9', price: 119.99, originalPrice: null, stock: 2, sku: 'SNK-004-RED-9' },
      { id: 404, color: 'Red', size: '10', price: 119.99, originalPrice: null, stock: 1, sku: 'SNK-004-RED-10' },
      { id: 405, color: 'Red', size: '11', price: 119.99, originalPrice: null, stock: 0, sku: 'SNK-004-RED-11' },
      { id: 406, color: 'Red', size: '12', price: 124.99, originalPrice: null, stock: 1, sku: 'SNK-004-RED-12' },
      { id: 407, color: 'Black', size: '8', price: 119.99, originalPrice: null, stock: 2, sku: 'SNK-004-BLK-8' },
      { id: 408, color: 'Black', size: '9', price: 119.99, originalPrice: null, stock: 3, sku: 'SNK-004-BLK-9' },
      { id: 409, color: 'Black', size: '10', price: 119.99, originalPrice: null, stock: 2, sku: 'SNK-004-BLK-10' },
      { id: 410, color: 'White', size: '9', price: 119.99, originalPrice: null, stock: 2, sku: 'SNK-004-WHT-9' },
      { id: 411, color: 'White', size: '10', price: 119.99, originalPrice: null, stock: 1, sku: 'SNK-004-WHT-10' }
    ]
  },
  {
    id: 5,
    name: 'Minimalist Watch',
    slug: 'minimalist-watch',
    description: 'Sleek minimalist watch with genuine leather strap and Japanese movement.',
    price: 79.99,
    originalPrice: 99.99,
    category: 'accessories',
    categoryName: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500'
    ],
    colors: ['Silver', 'Gold', 'Rose Gold'],
    sizes: null,
    stock: 20,
    featured: true,
    rating: 4.4,
    reviewCount: 95,
    variants: [
      { id: 501, color: 'Silver', size: null, price: 79.99, originalPrice: 99.99, stock: 8, sku: 'WTC-005-SLV' },
      { id: 502, color: 'Gold', size: null, price: 89.99, originalPrice: 109.99, stock: 6, sku: 'WTC-005-GLD' },
      { id: 503, color: 'Rose Gold', size: null, price: 94.99, originalPrice: 114.99, stock: 6, sku: 'WTC-005-RSG' }
    ]
  },
  {
    id: 6,
    name: 'Denim Jacket',
    slug: 'denim-jacket',
    description: 'Classic denim jacket with vintage wash. Timeless style for any occasion.',
    price: 69.99,
    originalPrice: null,
    category: 'clothing',
    categoryName: 'Clothing',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500',
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500'
    ],
    colors: ['Blue', 'Light Blue', 'Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 18,
    featured: false,
    rating: 4.3,
    reviewCount: 67,
    variants: [
      { id: 601, color: 'Blue', size: 'S', price: 69.99, originalPrice: null, stock: 3, sku: 'JKT-006-BLU-S' },
      { id: 602, color: 'Blue', size: 'M', price: 69.99, originalPrice: null, stock: 4, sku: 'JKT-006-BLU-M' },
      { id: 603, color: 'Blue', size: 'L', price: 69.99, originalPrice: null, stock: 2, sku: 'JKT-006-BLU-L' },
      { id: 604, color: 'Blue', size: 'XL', price: 74.99, originalPrice: null, stock: 1, sku: 'JKT-006-BLU-XL' },
      { id: 605, color: 'Light Blue', size: 'M', price: 69.99, originalPrice: null, stock: 3, sku: 'JKT-006-LBL-M' },
      { id: 606, color: 'Light Blue', size: 'L', price: 69.99, originalPrice: null, stock: 2, sku: 'JKT-006-LBL-L' },
      { id: 607, color: 'Black', size: 'S', price: 74.99, originalPrice: null, stock: 1, sku: 'JKT-006-BLK-S' },
      { id: 608, color: 'Black', size: 'M', price: 74.99, originalPrice: null, stock: 2, sku: 'JKT-006-BLK-M' }
    ]
  },
  {
    id: 7,
    name: 'Smart Fitness Tracker',
    slug: 'smart-fitness-tracker',
    description: 'Advanced fitness tracker with heart rate monitor, GPS, and water resistance.',
    price: 129.99,
    originalPrice: 159.99,
    category: 'electronics',
    categoryName: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500',
      'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=500'
    ],
    colors: ['Black', 'Navy', 'Pink'],
    sizes: null,
    stock: 22,
    featured: true,
    rating: 4.6,
    reviewCount: 312,
    variants: [
      { id: 701, color: 'Black', size: null, price: 129.99, originalPrice: 159.99, stock: 10, sku: 'FIT-007-BLK' },
      { id: 702, color: 'Navy', size: null, price: 129.99, originalPrice: 159.99, stock: 7, sku: 'FIT-007-NAV' },
      { id: 703, color: 'Pink', size: null, price: 134.99, originalPrice: 164.99, stock: 5, sku: 'FIT-007-PNK' }
    ]
  },
  {
    id: 8,
    name: 'Canvas Backpack',
    slug: 'canvas-backpack',
    description: 'Durable canvas backpack with laptop compartment and multiple pockets.',
    price: 59.99,
    originalPrice: null,
    category: 'accessories',
    categoryName: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=500'
    ],
    colors: ['Gray', 'Navy', 'Olive'],
    sizes: null,
    stock: 30,
    featured: false,
    rating: 4.5,
    reviewCount: 143,
    variants: [
      { id: 801, color: 'Gray', size: null, price: 59.99, originalPrice: null, stock: 12, sku: 'BPK-008-GRY' },
      { id: 802, color: 'Navy', size: null, price: 59.99, originalPrice: null, stock: 10, sku: 'BPK-008-NAV' },
      { id: 803, color: 'Olive', size: null, price: 64.99, originalPrice: null, stock: 8, sku: 'BPK-008-OLV' }
    ]
  }
]

export const categories = [
  { id: 'clothing', name: 'Clothing', icon: '👕', count: 2 },
  { id: 'accessories', name: 'Accessories', icon: '👜', count: 3 },
  { id: 'electronics', name: 'Electronics', icon: '🎧', count: 2 },
  { id: 'footwear', name: 'Footwear', icon: '👟', count: 1 }
]
