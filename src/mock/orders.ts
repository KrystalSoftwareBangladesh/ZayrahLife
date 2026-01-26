export const orders = [
  {
    id: 'ORD-001',
    date: '2024-01-15',
    status: 'delivered',
    statusLabel: 'Delivered',
    items: [
      { productId: 1, name: 'Classic White T-Shirt', price: 29.99, quantity: 2, color: 'White', size: 'M' },
      { productId: 5, name: 'Minimalist Watch', price: 79.99, quantity: 1, color: 'Silver', size: null }
    ],
    subtotal: 139.97,
    shipping: 5.99,
    tax: 11.20,
    total: 157.16,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA'
    },
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'ORD-002',
    date: '2024-01-20',
    status: 'shipped',
    statusLabel: 'Shipped',
    items: [
      { productId: 3, name: 'Wireless Bluetooth Headphones', price: 149.99, quantity: 1, color: 'Black', size: null }
    ],
    subtotal: 149.99,
    shipping: 0,
    tax: 12.00,
    total: 161.99,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA'
    },
    trackingNumber: 'TRK987654321'
  },
  {
    id: 'ORD-003',
    date: '2024-01-25',
    status: 'processing',
    statusLabel: 'Processing',
    items: [
      { productId: 4, name: 'Running Sneakers', price: 119.99, quantity: 1, color: 'Red', size: '10' },
      { productId: 8, name: 'Canvas Backpack', price: 59.99, quantity: 1, color: 'Navy', size: null }
    ],
    subtotal: 179.98,
    shipping: 5.99,
    tax: 14.40,
    total: 200.37,
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA'
    },
    trackingNumber: null
  }
]
