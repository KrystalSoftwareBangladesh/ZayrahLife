export const mockSuppliers = [
  {
    id: 1,
    name: 'Fashion Wholesale Ltd',
    email: 'orders@fashionwholesale.com',
    phone: '+880-1711-234567',
    address: 'Gulshan-2, Dhaka, Bangladesh',
    contactPerson: 'Ahmed Rahman',
    category: 'Clothing',
    status: 'active',
    totalOrders: 45,
    totalSpent: 125000,
    lastOrderDate: '2025-01-20',
    paymentTerms: 'Net 30',
    notes: 'Reliable supplier for cotton products'
  },
  {
    id: 2,
    name: 'Tech Gadgets International',
    email: 'supply@techgadgets.com',
    phone: '+880-1812-345678',
    address: 'Banani, Dhaka, Bangladesh',
    contactPerson: 'Sarah Khan',
    category: 'Electronics',
    status: 'active',
    totalOrders: 28,
    totalSpent: 450000,
    lastOrderDate: '2025-01-18',
    paymentTerms: 'Net 15',
    notes: 'Best prices for electronics'
  },
  {
    id: 3,
    name: 'Leather Craft Co',
    email: 'sales@leathercraft.com',
    phone: '+880-1911-456789',
    address: 'Mirpur, Dhaka, Bangladesh',
    contactPerson: 'Karim Uddin',
    category: 'Accessories',
    status: 'active',
    totalOrders: 32,
    totalSpent: 89000,
    lastOrderDate: '2025-01-15',
    paymentTerms: 'COD',
    notes: 'Quality leather goods supplier'
  },
  {
    id: 4,
    name: 'Footwear Factory',
    email: 'orders@footwearfactory.com',
    phone: '+880-1611-567890',
    address: 'Uttara, Dhaka, Bangladesh',
    contactPerson: 'Rina Begum',
    category: 'Footwear',
    status: 'inactive',
    totalOrders: 12,
    totalSpent: 56000,
    lastOrderDate: '2024-11-20',
    paymentTerms: 'Net 45',
    notes: 'Currently not supplying due to production issues'
  }
]

export const mockPurchaseOrders = [
  {
    id: 'PO-2025-001',
    supplierId: 1,
    supplierName: 'Fashion Wholesale Ltd',
    items: [
      { productId: 1, productName: 'Classic White T-Shirt', variantId: 1, variantLabel: 'White / M', sku: 'TSH-001-WHT-M', quantity: 100, unitCost: 12.00, total: 1200 },
      { productId: 7, productName: 'Organic Cotton Hoodie', variantId: 25, variantLabel: 'Navy / L', sku: 'HOD-007-NAV-L', quantity: 50, unitCost: 32.00, total: 1600 }
    ],
    subtotal: 2800,
    tax: 140,
    shipping: 50,
    total: 2990,
    status: 'received',
    paymentStatus: 'paid',
    orderDate: '2025-01-15',
    expectedDate: '2025-01-20',
    receivedDate: '2025-01-19',
    notes: 'Urgent order for restocking'
  },
  {
    id: 'PO-2025-002',
    supplierId: 2,
    supplierName: 'Tech Gadgets International',
    items: [
      { productId: 3, productName: 'Wireless Bluetooth Headphones', variantId: 9, variantLabel: 'Black / One Size', sku: 'HPH-003-BLK-OS', quantity: 30, unitCost: 65.00, total: 1950 },
      { productId: 5, productName: 'Smart Fitness Watch', variantId: 17, variantLabel: 'Black / One Size', sku: 'WTC-005-BLK-OS', quantity: 20, unitCost: 85.00, total: 1700 }
    ],
    subtotal: 3650,
    tax: 182.50,
    shipping: 100,
    total: 3932.50,
    status: 'pending',
    paymentStatus: 'unpaid',
    orderDate: '2025-01-22',
    expectedDate: '2025-01-30',
    receivedDate: null,
    notes: 'Electronics restock'
  },
  {
    id: 'PO-2025-003',
    supplierId: 3,
    supplierName: 'Leather Craft Co',
    items: [
      { productId: 2, productName: 'Leather Crossbody Bag', variantId: 5, variantLabel: 'Brown / One Size', sku: 'BAG-002-BRN-OS', quantity: 25, unitCost: 35.00, total: 875 },
      { productId: 4, productName: 'Classic Leather Wallet', variantId: 13, variantLabel: 'Black / One Size', sku: 'WLT-004-BLK-OS', quantity: 40, unitCost: 18.00, total: 720 }
    ],
    subtotal: 1595,
    tax: 79.75,
    shipping: 30,
    total: 1704.75,
    status: 'ordered',
    paymentStatus: 'partial',
    orderDate: '2025-01-25',
    expectedDate: '2025-02-05',
    receivedDate: null,
    notes: 'Monthly leather goods order'
  }
]
