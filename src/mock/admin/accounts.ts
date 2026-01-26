export const mockAccounts = [
  { id: 1, name: 'Business Checking', type: 'income', balance: 45620.50, currency: 'USD' },
  { id: 2, name: 'Marketing Budget', type: 'expense', balance: -8500.00, currency: 'USD' },
  { id: 3, name: 'Inventory Investment', type: 'investment', balance: 25000.00, currency: 'USD' },
  { id: 4, name: 'Operating Expenses', type: 'expense', balance: -12340.00, currency: 'USD' },
  { id: 5, name: 'Sales Revenue', type: 'income', balance: 78900.00, currency: 'USD' }
]

export const mockTransactions = [
  {
    id: 1,
    accountId: 1,
    accountName: 'Business Checking',
    type: 'income',
    amount: 2450.00,
    description: 'Order payments batch #2026-01',
    category: 'Sales',
    date: '2026-01-25',
    reference: 'PAY-2026-0125'
  },
  {
    id: 2,
    accountId: 2,
    accountName: 'Marketing Budget',
    type: 'expense',
    amount: -1500.00,
    description: 'Facebook Ads Campaign',
    category: 'Marketing',
    date: '2026-01-24',
    reference: 'EXP-2026-0124'
  },
  {
    id: 3,
    accountId: 4,
    accountName: 'Operating Expenses',
    type: 'expense',
    amount: -450.00,
    description: 'Shipping supplies purchase',
    category: 'Operations',
    date: '2026-01-23',
    reference: 'EXP-2026-0123'
  },
  {
    id: 4,
    accountId: 3,
    accountName: 'Inventory Investment',
    type: 'investment',
    amount: 5000.00,
    description: 'New product line stock',
    category: 'Inventory',
    date: '2026-01-22',
    reference: 'INV-2026-0122'
  },
  {
    id: 5,
    accountId: 1,
    accountName: 'Business Checking',
    type: 'income',
    amount: 1890.50,
    description: 'Order payments batch #2026-02',
    category: 'Sales',
    date: '2026-01-21',
    reference: 'PAY-2026-0121'
  },
  {
    id: 6,
    accountId: 2,
    accountName: 'Marketing Budget',
    type: 'expense',
    amount: -800.00,
    description: 'Influencer partnership',
    category: 'Marketing',
    date: '2026-01-20',
    reference: 'EXP-2026-0120'
  },
  {
    id: 7,
    accountId: 4,
    accountName: 'Operating Expenses',
    type: 'expense',
    amount: -1200.00,
    description: 'Monthly software subscriptions',
    category: 'Operations',
    date: '2026-01-19',
    reference: 'EXP-2026-0119'
  },
  {
    id: 8,
    accountId: 5,
    accountName: 'Sales Revenue',
    type: 'income',
    amount: 3200.00,
    description: 'Wholesale order #WH-2026-05',
    category: 'Wholesale',
    date: '2026-01-18',
    reference: 'PAY-2026-0118'
  }
]
