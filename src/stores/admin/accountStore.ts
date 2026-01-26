import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockAccounts, mockTransactions } from '@/mock/admin/accounts'

interface NewAccount {
  name: string
  type: 'income' | 'expense' | 'asset' | 'liability' | 'equity' | 'investment'
  code?: string
  description?: string
}

interface NewTransaction {
  accountId: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  reference?: string
}

export const useAccountStore = defineStore('adminAccounts', () => {
  const accounts = ref([...mockAccounts])
  const transactions = ref([...mockTransactions])
  const loading = ref(false)

  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const totalExpenses = computed(() => {
    return Math.abs(transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0))
  })

  const netBalance = computed(() => totalIncome.value - totalExpenses.value)

  const incomeAccounts = computed(() => accounts.value.filter(a => a.type === 'income'))
  const expenseAccounts = computed(() => accounts.value.filter(a => a.type === 'expense'))
  const investmentAccounts = computed(() => accounts.value.filter(a => a.type === 'investment'))
  const assetAccounts = computed(() => accounts.value.filter(a => a.type === 'asset'))
  const liabilityAccounts = computed(() => accounts.value.filter(a => a.type === 'liability'))
  const equityAccounts = computed(() => accounts.value.filter(a => a.type === 'equity'))

  function getTransactionsByAccount(accountId: number) {
    return transactions.value.filter(t => t.accountId === accountId)
  }

  function getAccountById(id: number) {
    return accounts.value.find(a => a.id === id)
  }

  function addAccount(data: NewAccount) {
    const newId = Math.max(...accounts.value.map(a => a.id)) + 1
    const newAccount = {
      id: newId,
      name: data.name,
      type: data.type,
      code: data.code || `${data.type.toUpperCase().slice(0, 3)}-${String(newId).padStart(3, '0')}`,
      description: data.description || '',
      balance: 0,
      createdAt: new Date().toISOString()
    }
    accounts.value.push(newAccount)
    return newAccount
  }

  function addTransaction(data: NewTransaction) {
    const newId = Math.max(...transactions.value.map(t => t.id)) + 1
    const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)
    
    const newTransaction = {
      id: newId,
      accountId: data.accountId,
      date: data.date,
      description: data.description,
      amount,
      type: data.type,
      category: data.category,
      reference: data.reference || `TXN-${String(newId).padStart(6, '0')}`,
      createdAt: new Date().toISOString()
    }
    transactions.value.unshift(newTransaction)
    
    const account = accounts.value.find(a => a.id === data.accountId)
    if (account) {
      account.balance += amount
    }
    
    return newTransaction
  }

  return {
    accounts,
    transactions,
    loading,
    totalIncome,
    totalExpenses,
    netBalance,
    incomeAccounts,
    expenseAccounts,
    investmentAccounts,
    assetAccounts,
    liabilityAccounts,
    equityAccounts,
    getTransactionsByAccount,
    getAccountById,
    addAccount,
    addTransaction
  }
})
