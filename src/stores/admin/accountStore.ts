import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { accountsApi } from '@/api/accounts'
import { mockTransactions } from '@/mock/admin/accounts'
import type {
  ApiError,
  ChartOfAccountCreateRequest,
  ChartOfAccountDetail,
  ChartOfAccountList,
  ChartOfAccountListParams,
  ChartOfAccountUpdateRequest
} from '@/api/types'

export const useAccountStore = defineStore('adminAccounts', () => {
  const accounts = ref<ChartOfAccountList[]>([])
  const accountOptions = ref<ChartOfAccountList[]>([])
  const currentAccount = ref<ChartOfAccountDetail | null>(null)
  const transactions = ref([...mockTransactions])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalAccounts = computed(() => pagination.value.count)
  const activeAccounts = computed(() => accounts.value.filter(account => account.is_active).length)
  const rootAccounts = computed(() => accounts.value.filter(account => !account.parent).length)
  const totalIncome = computed(() =>
    transactions.value
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  )
  const totalExpenses = computed(() =>
    transactions.value
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  )
  const netBalance = computed(() => totalIncome.value - totalExpenses.value)
  const typeBreakdown = computed(() => ({
    ASSET: accounts.value.filter(account => account.account_type === 'ASSET').length,
    LIABILITY: accounts.value.filter(account => account.account_type === 'LIABILITY').length,
    EQUITY: accounts.value.filter(account => account.account_type === 'EQUITY').length,
    REVENUE: accounts.value.filter(account => account.account_type === 'REVENUE').length,
    EXPENSE: accounts.value.filter(account => account.account_type === 'EXPENSE').length
  }))

  async function fetchAccounts(params: ChartOfAccountListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await accountsApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ordering: params.ordering || 'code',
        ...params
      })

      accounts.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch chart of accounts'
      accounts.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchAccountOptions(): Promise<void> {
    try {
      const items: ChartOfAccountList[] = []
      let page = 1
      let hasNext = true

      while (hasNext && page <= 20) {
        const response = await accountsApi.list({
          page,
          page_size: 100,
          ordering: 'code',
          is_active: true
        })
        items.push(...response.results)
        hasNext = !!response.next
        page += 1
      }

      accountOptions.value = items
    } catch {
      accountOptions.value = []
    }
  }

  async function getAccountById(id: number): Promise<ChartOfAccountDetail | null> {
    loading.value = true
    error.value = null

    try {
      const account = await accountsApi.getById(id)
      currentAccount.value = account
      return account
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch account'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAccount(data: ChartOfAccountCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await accountsApi.create(data)
      await Promise.all([fetchAccounts({ page: 1 }), fetchAccountOptions()])
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create account'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateAccount(id: number, data: ChartOfAccountUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await accountsApi.update(id, data)
      await Promise.all([fetchAccounts(), fetchAccountOptions()])
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update account'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteAccount(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await accountsApi.delete(id)
      currentAccount.value = null
      await Promise.all([fetchAccounts(), fetchAccountOptions()])
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete account'
      return false
    } finally {
      loading.value = false
    }
  }

  function getAccountNameById(id: number | null): string {
    if (!id) return 'Root account'
    return accountOptions.value.find(account => account.id === id)?.name || `#${id}`
  }

  function setPage(page: number): void {
    pagination.value.page = page
  }

  function clearError(): void {
    error.value = null
  }

  return {
    accounts,
    accountOptions,
    currentAccount,
    transactions,
    loading,
    error,
    pagination,
    totalAccounts,
    activeAccounts,
    rootAccounts,
    totalIncome,
    totalExpenses,
    netBalance,
    typeBreakdown,
    fetchAccounts,
    fetchAccountOptions,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountNameById,
    setPage,
    clearError
  }
})
