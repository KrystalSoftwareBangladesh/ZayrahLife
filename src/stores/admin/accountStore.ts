import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { accountsApi } from '@/api/accounts'
import { transactionsApi } from '@/api/transactions'
import type {
  AccountType,
  AccountingTransactionCreateRequest,
  AccountingTransactionDetail,
  AccountingTransactionList,
  AccountingTransactionListParams,
  AccountingTransactionPostRequest,
  AccountingTransactionUpdateRequest,
  ApiError,
  ChartOfAccountCreateRequest,
  ChartOfAccountDetail,
  ChartOfAccountList,
  ChartOfAccountListParams,
  ChartOfAccountUpdateRequest,
  TransactionStatusOption
} from '@/api/types'

function parseAmount(value: string | undefined): number {
  const parsed = Number.parseFloat(value || '0')
  return Number.isFinite(parsed) ? parsed : 0
}

function compareValues(a: string | boolean | null | undefined, b: string | boolean | null | undefined): number {
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' })
}

function sortAccounts(items: ChartOfAccountList[], ordering: string): ChartOfAccountList[] {
  const isDescending = ordering.startsWith('-')
  const field = isDescending ? ordering.slice(1) : ordering
  const direction = isDescending ? -1 : 1

  return [...items].sort((left, right) => {
    let comparison = 0

    switch (field) {
      case 'name':
        comparison = compareValues(left.name, right.name)
        break
      case 'account_type':
        comparison = compareValues(left.account_type, right.account_type)
        break
      case 'is_active':
        comparison = compareValues(left.is_active, right.is_active)
        break
      case 'code':
      default:
        comparison = compareValues(left.code, right.code)
        break
    }

    return comparison * direction
  })
}

export const useAccountStore = defineStore('adminAccounts', () => {
  const accounts = ref<ChartOfAccountList[]>([])
  const accountOptions = ref<ChartOfAccountList[]>([])
  const currentAccount = ref<ChartOfAccountDetail | null>(null)
  const transactions = ref<AccountingTransactionList[]>([])
  const currentTransaction = ref<AccountingTransactionDetail | null>(null)
  const transactionStatuses = ref<TransactionStatusOption[]>([])
  const defaultTransactionStatus = ref<string>('DRAFT')
  const loading = ref(false)
  const transactionLoading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const transactionPagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalAccounts = computed(() => pagination.value.count)
  const activeAccounts = computed(() => accounts.value.filter(account => account.is_active).length)
  const rootAccounts = computed(() => accounts.value.filter(account => !account.parent).length)
  const totalDebits = computed(() =>
    transactions.value.reduce((sum, transaction) => sum + parseAmount(transaction.total_debit), 0)
  )
  const totalCredits = computed(() =>
    transactions.value.reduce((sum, transaction) => sum + parseAmount(transaction.total_credit), 0)
  )
  const netMovement = computed(() => totalCredits.value - totalDebits.value)
  const totalIncome = computed(() => totalCredits.value)
  const totalExpenses = computed(() => totalDebits.value)
  const netBalance = computed(() => netMovement.value)
  const draftTransactions = computed(() =>
    transactions.value.filter(transaction => transaction.status === 'DRAFT').length
  )
  const postedTransactions = computed(() =>
    transactions.value.filter(transaction => transaction.status === 'POSTED').length
  )
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

  async function fetchAccountsByTypes(
    accountTypes: AccountType[],
    params: Omit<ChartOfAccountListParams, 'account_type'> = {}
  ): Promise<void> {
    if (accountTypes.length <= 1) {
      await fetchAccounts({
        ...params,
        account_type: accountTypes[0]
      })
      return
    }

    loading.value = true
    error.value = null

    try {
      const page = params.page || pagination.value.page
      const pageSize = params.page_size || pagination.value.pageSize
      const ordering = params.ordering || 'code'
      const mergedItems: ChartOfAccountList[] = []
      const seenIds = new Set<number>()

      for (const accountType of accountTypes) {
        let nextPage = 1
        let hasNext = true

        while (hasNext && nextPage <= 20) {
          const response = await accountsApi.list({
            ...params,
            page: nextPage,
            page_size: 100,
            ordering,
            account_type: accountType
          })

          for (const account of response.results) {
            if (seenIds.has(account.id)) continue
            seenIds.add(account.id)
            mergedItems.push(account)
          }

          hasNext = !!response.next
          nextPage += 1
        }
      }

      const orderedItems = sortAccounts(mergedItems, ordering)
      const startIndex = (page - 1) * pageSize
      const pagedItems = orderedItems.slice(startIndex, startIndex + pageSize)

      accounts.value = pagedItems
      pagination.value = {
        count: orderedItems.length,
        page,
        pageSize,
        hasNext: startIndex + pageSize < orderedItems.length,
        hasPrevious: page > 1
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

  async function fetchTransactions(params: AccountingTransactionListParams = {}): Promise<void> {
    transactionLoading.value = true
    error.value = null

    try {
      const response = await transactionsApi.list({
        page: params.page || transactionPagination.value.page,
        page_size: params.page_size || transactionPagination.value.pageSize,
        ordering: params.ordering || '-transaction_date',
        ...params
      })

      const baseResults = response.results
      const needsLineHydration = baseResults.some(transaction => !transaction.lines)
      const hydratedResults = needsLineHydration
        ? await Promise.all(
            baseResults.map(async transaction => {
              if (transaction.lines) return transaction

              try {
                const detail = await transactionsApi.getById(transaction.id)
                return {
                  ...transaction,
                  lines: detail.lines
                }
              } catch {
                return transaction
              }
            })
          )
        : baseResults

      transactions.value = hydratedResults
      transactionPagination.value = {
        count: response.count,
        page: params.page || transactionPagination.value.page,
        pageSize: params.page_size || transactionPagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch transactions'
      transactions.value = []
    } finally {
      transactionLoading.value = false
    }
  }

  async function fetchTransactionStatuses(): Promise<void> {
    try {
      const response = await transactionsApi.getStatuses()
      transactionStatuses.value = response.statuses
      defaultTransactionStatus.value = response.default
    } catch {
      transactionStatuses.value = []
      defaultTransactionStatus.value = 'DRAFT'
    }
  }

  async function getTransactionById(id: number): Promise<AccountingTransactionDetail | null> {
    transactionLoading.value = true
    error.value = null

    try {
      const transaction = await transactionsApi.getById(id)
      currentTransaction.value = transaction
      return transaction
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch transaction'
      return null
    } finally {
      transactionLoading.value = false
    }
  }

  async function createTransaction(data: AccountingTransactionCreateRequest): Promise<boolean> {
    transactionLoading.value = true
    error.value = null

    try {
      await transactionsApi.create(data)
      await fetchTransactions({ page: 1 })
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create transaction'
      return false
    } finally {
      transactionLoading.value = false
    }
  }

  async function updateTransaction(id: number, data: AccountingTransactionUpdateRequest): Promise<boolean> {
    transactionLoading.value = true
    error.value = null

    try {
      await transactionsApi.update(id, data)
      await fetchTransactions()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update transaction'
      return false
    } finally {
      transactionLoading.value = false
    }
  }

  async function deleteTransaction(id: number): Promise<boolean> {
    transactionLoading.value = true
    error.value = null

    try {
      await transactionsApi.delete(id)
      currentTransaction.value = null
      await fetchTransactions()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete transaction'
      return false
    } finally {
      transactionLoading.value = false
    }
  }

  async function postTransaction(id: number, data: AccountingTransactionPostRequest): Promise<boolean> {
    transactionLoading.value = true
    error.value = null

    try {
      const response = await transactionsApi.post(id, data)
      currentTransaction.value = response
      await fetchTransactions()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to post transaction'
      return false
    } finally {
      transactionLoading.value = false
    }
  }

  function getAccountNameById(id: number | null): string {
    if (!id) return 'Root account'
    return accountOptions.value.find(account => account.id === id)?.name || `#${id}`
  }

  function setPage(page: number): void {
    pagination.value.page = page
  }

  function setTransactionPage(page: number): void {
    transactionPagination.value.page = page
  }

  function clearError(): void {
    error.value = null
  }

  return {
    accounts,
    accountOptions,
    currentAccount,
    transactions,
    currentTransaction,
    transactionStatuses,
    defaultTransactionStatus,
    loading,
    transactionLoading,
    error,
    pagination,
    transactionPagination,
    totalAccounts,
    activeAccounts,
    rootAccounts,
    totalDebits,
    totalCredits,
    netMovement,
    totalIncome,
    totalExpenses,
    netBalance,
    draftTransactions,
    postedTransactions,
    typeBreakdown,
    fetchAccounts,
    fetchAccountsByTypes,
    fetchAccountOptions,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    fetchTransactions,
    fetchTransactionStatuses,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    postTransaction,
    getAccountNameById,
    setPage,
    setTransactionPage,
    clearError
  }
})
