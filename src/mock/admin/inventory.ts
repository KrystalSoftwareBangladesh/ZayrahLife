export const mockInventory = [
  {
    id: 1,
    productId: 1,
    productName: 'Classic White T-Shirt',
    category: 'Clothing',
    variants: [
      { id: 1, color: 'White', size: 'S', sku: 'CWT-W-S', stock: 45, lowStockThreshold: 10 },
      { id: 2, color: 'White', size: 'M', sku: 'CWT-W-M', stock: 32, lowStockThreshold: 10 },
      { id: 3, color: 'White', size: 'L', sku: 'CWT-W-L', stock: 28, lowStockThreshold: 10 },
      { id: 4, color: 'White', size: 'XL', sku: 'CWT-W-XL', stock: 15, lowStockThreshold: 10 }
    ],
    totalStock: 120,
    price: 29.99,
    cost: 12.00
  },
  {
    id: 2,
    productId: 2,
    productName: 'Leather Crossbody Bag',
    category: 'Accessories',
    variants: [
      { id: 5, color: 'Brown', size: 'One Size', sku: 'LCB-BR', stock: 18, lowStockThreshold: 5 },
      { id: 6, color: 'Black', size: 'One Size', sku: 'LCB-BK', stock: 12, lowStockThreshold: 5 }
    ],
    totalStock: 30,
    price: 89.99,
    cost: 35.00
  },
  {
    id: 3,
    productId: 3,
    productName: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    variants: [
      { id: 7, color: 'Black', size: 'One Size', sku: 'WBH-BK', stock: 8, lowStockThreshold: 10 },
      { id: 8, color: 'White', size: 'One Size', sku: 'WBH-WH', stock: 5, lowStockThreshold: 10 }
    ],
    totalStock: 13,
    price: 149.99,
    cost: 65.00
  },
  {
    id: 4,
    productId: 4,
    productName: 'Classic Leather Wallet',
    category: 'Accessories',
    variants: [
      { id: 9, color: 'Black', size: 'One Size', sku: 'CLW-BK', stock: 42, lowStockThreshold: 10 },
      { id: 10, color: 'Brown', size: 'One Size', sku: 'CLW-BR', stock: 38, lowStockThreshold: 10 }
    ],
    totalStock: 80,
    price: 49.99,
    cost: 18.00
  },
  {
    id: 5,
    productId: 5,
    productName: 'Smart Fitness Watch',
    category: 'Electronics',
    variants: [
      { id: 11, color: 'Black', size: 'One Size', sku: 'SFW-BK', stock: 3, lowStockThreshold: 5 },
      { id: 12, color: 'Silver', size: 'One Size', sku: 'SFW-SL', stock: 7, lowStockThreshold: 5 }
    ],
    totalStock: 10,
    price: 199.99,
    cost: 85.00
  },
  {
    id: 6,
    productId: 6,
    productName: 'Minimalist Running Shoes',
    category: 'Footwear',
    variants: [
      { id: 13, color: 'White', size: '7', sku: 'MRS-WH-7', stock: 12, lowStockThreshold: 3 },
      { id: 14, color: 'White', size: '8', sku: 'MRS-WH-8', stock: 15, lowStockThreshold: 3 },
      { id: 15, color: 'White', size: '9', sku: 'MRS-WH-9', stock: 18, lowStockThreshold: 3 },
      { id: 16, color: 'Black', size: '8', sku: 'MRS-BK-8', stock: 10, lowStockThreshold: 3 }
    ],
    totalStock: 55,
    price: 129.99,
    cost: 55.00
  },
  {
    id: 7,
    productId: 7,
    productName: 'Organic Cotton Hoodie',
    category: 'Clothing',
    variants: [
      { id: 17, color: 'Gray', size: 'M', sku: 'OCH-GR-M', stock: 22, lowStockThreshold: 5 },
      { id: 18, color: 'Gray', size: 'L', sku: 'OCH-GR-L', stock: 18, lowStockThreshold: 5 },
      { id: 19, color: 'Navy', size: 'L', sku: 'OCH-NV-L', stock: 14, lowStockThreshold: 5 }
    ],
    totalStock: 54,
    price: 79.99,
    cost: 32.00
  },
  {
    id: 8,
    productId: 8,
    productName: 'Vintage Sunglasses',
    category: 'Accessories',
    variants: [
      { id: 20, color: 'Black', size: 'One Size', sku: 'VSG-BK', stock: 0, lowStockThreshold: 5 },
      { id: 21, color: 'Tortoise', size: 'One Size', sku: 'VSG-TR', stock: 6, lowStockThreshold: 5 }
    ],
    totalStock: 6,
    price: 59.99,
    cost: 22.00
  }
]
