export const mockAccounts = [
  { id: 1, name: 'Business Checking', code: 'INC-001', type: 'income', balance: 45620.50, currency: 'USD', description: 'Main business checking account' },
  { id: 2, name: 'Marketing Budget', code: 'EXP-001', type: 'expense', balance: -8500.00, currency: 'USD', description: 'Marketing and advertising expenses' },
  { id: 3, name: 'Inventory Investment', code: 'INV-001', type: 'investment', balance: 25000.00, currency: 'USD', description: 'Product inventory investments' },
  { id: 4, name: 'Operating Expenses', code: 'EXP-002', type: 'expense', balance: -12340.00, currency: 'USD', description: 'Day-to-day operating costs' },
  { id: 5, name: 'Sales Revenue', code: 'INC-002', type: 'income', balance: 78900.00, currency: 'USD', description: 'Revenue from product sales' },
  { id: 6, name: 'Cash on Hand', code: 'AST-001', type: 'asset', balance: 15000.00, currency: 'USD', description: 'Petty cash and cash reserves' },
  { id: 7, name: 'Accounts Payable', code: 'LIA-001', type: 'liability', balance: -5000.00, currency: 'USD', description: 'Outstanding supplier payments' },
  { id: 8, name: 'Owner Equity', code: 'EQU-001', type: 'equity', balance: 100000.00, currency: 'USD', description: 'Owner investment in business' }
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
