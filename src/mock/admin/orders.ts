export const mockAdminOrders = [
  {
    id: 'ORD-2026-001',
    customerId: 1,
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    items: [
      { productId: 1, name: 'Classic White T-Shirt', variant: 'White / M', quantity: 2, price: 29.99 },
      { productId: 3, name: 'Wireless Bluetooth Headphones', variant: 'Black', quantity: 1, price: 149.99 }
    ],
    subtotal: 209.97,
    shipping: 9.99,
    tax: 17.50,
    total: 237.46,
    status: 'delivered',
    channel: 'WEBSITE',
    paymentMethod: 'Credit Card',
    shippingAddress: '123 Main St, New York, NY 10001',
    createdAt: '2026-01-20T10:30:00Z',
    updatedAt: '2026-01-22T14:00:00Z'
  },
  {
    id: 'ORD-2026-002',
    customerId: 5,
    customerName: 'Maria Garcia',
    customerEmail: 'mgarcia@email.com',
    items: [
      { productId: 2, name: 'Leather Crossbody Bag', variant: 'Brown', quantity: 1, price: 89.99 }
    ],
    subtotal: 89.99,
    shipping: 0,
    tax: 7.50,
    total: 97.49,
    status: 'shipped',
    channel: 'FACEBOOK',
    paymentMethod: 'PayPal',
    shippingAddress: '654 Birch Ln, Miami, FL 33101',
    createdAt: '2026-01-22T09:15:00Z',
    updatedAt: '2026-01-23T11:00:00Z'
  },
  {
    id: 'ORD-2026-003',
    customerId: 2,
    customerName: 'Michael Chen',
    customerEmail: 'mchen@email.com',
    items: [
      { productId: 5, name: 'Smart Fitness Watch', variant: 'Black', quantity: 1, price: 199.99 },
      { productId: 4, name: 'Classic Leather Wallet', variant: 'Black', quantity: 1, price: 49.99 }
    ],
    subtotal: 249.98,
    shipping: 9.99,
    tax: 20.83,
    total: 280.80,
    status: 'processing',
    channel: 'WEBSITE',
    paymentMethod: 'Credit Card',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    createdAt: '2026-01-24T14:45:00Z',
    updatedAt: '2026-01-24T14:45:00Z'
  },
  {
    id: 'ORD-2026-004',
    customerId: 3,
    customerName: 'Emily Davis',
    customerEmail: 'emily.d@email.com',
    items: [
      { productId: 6, name: 'Minimalist Running Shoes', variant: 'White / 8', quantity: 1, price: 129.99 }
    ],
    subtotal: 129.99,
    shipping: 9.99,
    tax: 10.83,
    total: 150.81,
    status: 'pending',
    channel: 'WEBSITE',
    paymentMethod: 'Credit Card',
    shippingAddress: '789 Pine Rd, Chicago, IL 60601',
    createdAt: '2026-01-25T08:00:00Z',
    updatedAt: '2026-01-25T08:00:00Z'
  },
  {
    id: 'ORD-2026-005',
    customerId: 5,
    customerName: 'Maria Garcia',
    customerEmail: 'mgarcia@email.com',
    items: [
      { productId: 7, name: 'Organic Cotton Hoodie', variant: 'Gray / L', quantity: 2, price: 79.99 }
    ],
    subtotal: 159.98,
    shipping: 0,
    tax: 13.33,
    total: 173.31,
    status: 'delivered',
    channel: 'FACEBOOK',
    paymentMethod: 'PayPal',
    shippingAddress: '654 Birch Ln, Miami, FL 33101',
    createdAt: '2026-01-18T16:30:00Z',
    updatedAt: '2026-01-21T10:00:00Z'
  }
]
