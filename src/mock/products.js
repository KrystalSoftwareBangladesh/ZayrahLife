export const products = [
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
    reviews: 128
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
    reviews: 89
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
    reviews: 256
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
    reviews: 178
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
    reviews: 95
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
    reviews: 67
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
    reviews: 312
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
    reviews: 143
  }
]

export const categories = [
  { id: 'clothing', name: 'Clothing', icon: '👕', count: 2 },
  { id: 'accessories', name: 'Accessories', icon: '👜', count: 3 },
  { id: 'electronics', name: 'Electronics', icon: '🎧', count: 2 },
  { id: 'footwear', name: 'Footwear', icon: '👟', count: 1 }
]
