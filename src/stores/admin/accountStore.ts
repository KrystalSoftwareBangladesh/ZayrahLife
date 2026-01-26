import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockAccounts, mockTransactions } from '@/mock/admin/accounts'

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

  function getTransactionsByAccount(accountId: number) {
    return transactions.value.filter(t => t.accountId === accountId)
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
    getTransactionsByAccount
  }
})
