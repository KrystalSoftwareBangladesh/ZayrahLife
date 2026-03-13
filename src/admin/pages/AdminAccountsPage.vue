<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import StatCard from '@/components/admin/StatCard.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useAccountStore } from '@/stores/admin/accountStore'
import type {
  AccountType,
  AccountingTransactionDetail,
  AccountingTransactionList,
  AccountingTransactionLine,
  AccountingTransactionListParams,
  ChartOfAccountList,
  ChartOfAccountListParams,
  TransactionStatus
} from '@/api/types'

type AccountFormState = {
  code: string
  name: string
  account_type: AccountType
  parent: string
  description: string
  is_active: 'true' | 'false'
}

type TransactionLineFormState = {
  account_id: string
  description: string
  debit_amount: string
  credit_amount: string
}

type TransactionEntryType =
  | 'INCOME'
  | 'EXPENSE'
  | 'ASSET_PURCHASE'
  | 'LIABILITY_PAYMENT'
  | 'EQUITY_FUNDING'
  | 'CUSTOM'

type TransactionFormState = {
  transaction_type: TransactionEntryType
  transaction_date: string
  reference: string
  description: string
  lines: TransactionLineFormState[]
}

const accountStore = useAccountStore()

const activeTab = ref<'accounts' | 'transactions' | 'roadmap'>('accounts')

const showAccountModal = ref(false)
const showDeleteAccountModal = ref(false)
const editingAccountId = ref<number | null>(null)
const accountPendingDelete = ref<ChartOfAccountList | null>(null)

const showTransactionModal = ref(false)
const showDeleteTransactionModal = ref(false)
const editingTransactionId = ref<number | null>(null)
const transactionPendingDelete = ref<AccountingTransactionList | null>(null)

const accountFilters = ref<{
  search: string
  account_type: AccountType[]
  status: '' | 'true' | 'false'
}>({
  search: '',
  account_type: [],
  status: ''
})

const transactionFilters = ref<{
  search: string
  status: '' | TransactionStatus
  account: string
  transaction_date_min: string
  transaction_date_max: string
}>({
  search: '',
  status: '',
  account: '',
  transaction_date_min: '',
  transaction_date_max: ''
})

const accountForm = ref<AccountFormState>(createEmptyAccountForm())
const transactionForm = ref<TransactionFormState>(createEmptyTransactionForm())
const suppressAccountFilterWatch = ref(false)
let accountSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const accountColumns = [
  { key: 'code', label: 'Code', width: '120px' },
  { key: 'name', label: 'Account Name' },
  { key: 'account_type', label: 'Type', width: '140px' },
  { key: 'parent', label: 'Parent', width: '180px' },
  { key: 'is_active', label: 'Status', width: '120px' }
]

const transactionColumns = [
  { key: 'transaction_no', label: 'Transaction No', width: '170px' },
  { key: 'transaction_date', label: 'Date', width: '130px' },
  { key: 'debit_account', label: 'Debit Account', width: '220px' },
  { key: 'credit_account', label: 'Credit Account', width: '220px' },
  { key: 'reference', label: 'Reference', width: '160px' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'total_debit', label: 'Debit', width: '120px' },
  { key: 'total_credit', label: 'Credit', width: '120px' }
]

const accountTypeOptions = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' }
]

const accountFilterTypePills = [
  { value: '', label: 'All', badge: 'A', badgeClass: 'bg-slate-200 text-slate-700' },
  { value: 'ASSET', label: 'Asset', badge: 'S', badgeClass: 'bg-emerald-100 text-emerald-700' },
  { value: 'LIABILITY', label: 'Liability', badge: 'L', badgeClass: 'bg-amber-100 text-amber-700' },
  { value: 'EQUITY', label: 'Equity', badge: 'E', badgeClass: 'bg-violet-100 text-violet-700' },
  { value: 'REVENUE', label: 'Revenue', badge: 'R', badgeClass: 'bg-sky-100 text-sky-700' },
  { value: 'EXPENSE', label: 'Expense', badge: 'X', badgeClass: 'bg-rose-100 text-rose-700' }
] as const

const accountStatusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
]

const accountStatusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
]

const transactionTypeOptions: { value: TransactionEntryType; label: string }[] = [
  { value: 'INCOME', label: 'Add Income' },
  { value: 'EXPENSE', label: 'Add Expense' },
  { value: 'ASSET_PURCHASE', label: 'Add Asset' },
  { value: 'LIABILITY_PAYMENT', label: 'Pay Liability' },
  { value: 'EQUITY_FUNDING', label: 'Add Equity' },
  { value: 'CUSTOM', label: 'Custom Journal' }
]

const transactionTypePresets: Record<
  Exclude<TransactionEntryType, 'CUSTOM'>,
  {
    description: string
    debitLabel: string
    debitAccountTypes: AccountType[]
    creditLabel: string
    creditAccountTypes: AccountType[]
  }
> = {
  INCOME: {
    description: 'Debit an asset account and credit a revenue account.',
    debitLabel: 'Asset Account',
    debitAccountTypes: ['ASSET'],
    creditLabel: 'Revenue Account',
    creditAccountTypes: ['REVENUE']
  },
  EXPENSE: {
    description: 'Debit an expense account and credit an asset account.',
    debitLabel: 'Expense Account',
    debitAccountTypes: ['EXPENSE'],
    creditLabel: 'Asset Account',
    creditAccountTypes: ['ASSET']
  },
  ASSET_PURCHASE: {
    description: 'Debit an asset account and credit a liability account.',
    debitLabel: 'Asset Account',
    debitAccountTypes: ['ASSET'],
    creditLabel: 'Liability Account',
    creditAccountTypes: ['LIABILITY']
  },
  LIABILITY_PAYMENT: {
    description: 'Debit a liability account and credit an asset account.',
    debitLabel: 'Liability Account',
    debitAccountTypes: ['LIABILITY'],
    creditLabel: 'Asset Account',
    creditAccountTypes: ['ASSET']
  },
  EQUITY_FUNDING: {
    description: 'Debit an asset account and credit an equity account.',
    debitLabel: 'Asset Account',
    debitAccountTypes: ['ASSET'],
    creditLabel: 'Equity Account',
    creditAccountTypes: ['EQUITY']
  }
}

const transactionStatusFilterOptions = computed(() => [
  { value: '', label: 'All statuses' },
  ...accountStore.transactionStatuses
])

const accountSelectOptions = computed(() => [
  { value: '', label: 'All accounts' },
  ...accountStore.accountOptions.map(account => ({
    value: String(account.id),
    label: `${account.code} - ${account.name}`
  }))
])

const parentOptions = computed(() => {
  const currentId = editingAccountId.value

  return [
    { value: '', label: 'Root account' },
    ...accountStore.accountOptions
      .filter(account => account.id !== currentId)
      .map(account => ({
        value: String(account.id),
        label: `${account.code} - ${account.name}`
      }))
  ]
})

const editableTransaction = computed(() => accountStore.currentTransaction?.status !== 'POSTED')

const moduleStats = computed(() => [
  {
    title: 'Total Accounts',
    value: accountStore.totalAccounts,
    icon: 'file',
    color: 'primary'
  },
  {
    title: 'Draft Entries',
    value: accountStore.draftTransactions,
    icon: 'clock',
    color: 'yellow'
  },
  {
    title: 'Posted Entries',
    value: accountStore.postedTransactions,
    icon: 'check',
    color: 'green'
  }
])

const movementStats = computed(() => [
  { label: 'Debits', value: accountStore.totalDebits },
  { label: 'Credits', value: accountStore.totalCredits },
  { label: 'Net Movement', value: accountStore.netMovement }
])

const typeSummary = computed(() => [
  { label: 'Assets', value: accountStore.typeBreakdown.ASSET },
  { label: 'Liabilities', value: accountStore.typeBreakdown.LIABILITY },
  { label: 'Equity', value: accountStore.typeBreakdown.EQUITY },
  { label: 'Revenue', value: accountStore.typeBreakdown.REVENUE },
  { label: 'Expenses', value: accountStore.typeBreakdown.EXPENSE }
])

const editingAccount = computed(() =>
  accountStore.accounts.find(account => account.id === editingAccountId.value) || null
)

const editingTransaction = computed(() =>
  accountStore.transactions.find(transaction => transaction.id === editingTransactionId.value) || null
)

const selectedTransactionPreset = computed(() =>
  transactionForm.value.transaction_type === 'CUSTOM'
    ? null
    : transactionTypePresets[transactionForm.value.transaction_type]
)

const debitAccountOptions = computed(() => {
  const preset = selectedTransactionPreset.value
  if (!preset) return []

  return accountStore.accountOptions
    .filter(account => preset.debitAccountTypes.includes(account.account_type))
    .map(account => ({
      value: String(account.id),
      label: `${account.code} - ${account.name}`
    }))
})

const creditAccountOptions = computed(() => {
  const preset = selectedTransactionPreset.value
  if (!preset) return []

  return accountStore.accountOptions
    .filter(account => preset.creditAccountTypes.includes(account.account_type))
    .map(account => ({
      value: String(account.id),
      label: `${account.code} - ${account.name}`
    }))
})

const presetAmount = computed({
  get: () => {
    const [debitLine, creditLine] = transactionForm.value.lines
    return debitLine?.debit_amount || creditLine?.credit_amount || ''
  },
  set: (value: string) => {
    if (transactionForm.value.transaction_type === 'CUSTOM') return
    ensurePresetLines(transactionForm.value.transaction_type)
    transactionForm.value.lines[0].debit_amount = value
    transactionForm.value.lines[0].credit_amount = ''
    transactionForm.value.lines[1].debit_amount = ''
    transactionForm.value.lines[1].credit_amount = value
  }
})

const lineTotals = computed(() => {
  const debit = transactionForm.value.lines.reduce((sum, line) => sum + normalizeAmount(line.debit_amount), 0)
  const credit = transactionForm.value.lines.reduce((sum, line) => sum + normalizeAmount(line.credit_amount), 0)
  return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 }
})

const roadmap = [
  {
    title: 'Phase 1: Master Data',
    description: 'Chart of accounts and accounting transactions are now API-backed.',
    status: 'Complete'
  },
  {
    title: 'Phase 2: Posting Controls',
    description: 'Enforce review workflow around draft entries, posting, and period locking.',
    status: 'In progress'
  },
  {
    title: 'Phase 3: Subledgers',
    description: 'Accounts receivable, accounts payable, supplier/customer reconciliation, and payment allocation.',
    status: 'Next'
  },
  {
    title: 'Phase 4: Reporting',
    description: 'Trial balance, general ledger, profit and loss, balance sheet, cash flow, and audit trail exports.',
    status: 'Planned'
  }
]

function formatCurrency(value: string | number | undefined): string {
  const amount = typeof value === 'number' ? value : normalizeAmount(value)
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizeAmount(value: string | undefined): number {
  const parsed = Number.parseFloat(value || '0')
  return Number.isFinite(parsed) ? parsed : 0
}

function createEmptyAccountForm(): AccountFormState {
  return {
    code: '',
    name: '',
    account_type: 'ASSET',
    parent: '',
    description: '',
    is_active: 'true'
  }
}

function createEmptyTransactionLine(): TransactionLineFormState {
  return {
    account_id: '',
    description: '',
    debit_amount: '',
    credit_amount: ''
  }
}

function createEmptyTransactionForm(): TransactionFormState {
  return {
    transaction_type: 'INCOME',
    transaction_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: createPresetLines()
  }
}

function createPresetLines(existingLines: TransactionLineFormState[] = []): TransactionLineFormState[] {
  const debitLine = existingLines[0]
  const creditLine = existingLines[1]
  const amount = debitLine?.debit_amount || creditLine?.credit_amount || ''

  return [
    {
      account_id: debitLine?.account_id || '',
      description: debitLine?.description || '',
      debit_amount: amount,
      credit_amount: ''
    },
    {
      account_id: creditLine?.account_id || '',
      description: creditLine?.description || '',
      debit_amount: '',
      credit_amount: amount
    }
  ]
}

function isAllowedAccountType(accountId: string, allowedTypes: AccountType[]): boolean {
  if (!accountId) return false
  const account = accountStore.accountOptions.find(item => String(item.id) === accountId)
  return !!account && allowedTypes.includes(account.account_type)
}

function ensurePresetLines(type: TransactionEntryType): void {
  if (type === 'CUSTOM') {
    if (!transactionForm.value.lines.length) {
      transactionForm.value.lines = [createEmptyTransactionLine(), createEmptyTransactionLine()]
    }
    return
  }

  const preset = transactionTypePresets[type]
  const nextLines = createPresetLines(transactionForm.value.lines)

  if (!isAllowedAccountType(nextLines[0].account_id, preset.debitAccountTypes)) {
    nextLines[0].account_id = ''
  }

  if (!isAllowedAccountType(nextLines[1].account_id, preset.creditAccountTypes)) {
    nextLines[1].account_id = ''
  }

  transactionForm.value.lines = nextLines
}

function handleTransactionTypeChange(value: string): void {
  const type = value as TransactionEntryType
  transactionForm.value.transaction_type = type
  ensurePresetLines(type)
}

function inferTransactionType(lines: AccountingTransactionDetail['lines']): TransactionEntryType {
  if (lines.length !== 2) return 'CUSTOM'

  const debitLine = lines.find(line => normalizeAmount(line.debit_amount) > 0 && normalizeAmount(line.credit_amount) === 0)
  const creditLine = lines.find(line => normalizeAmount(line.credit_amount) > 0 && normalizeAmount(line.debit_amount) === 0)

  if (!debitLine || !creditLine) return 'CUSTOM'

  const debitType = debitLine.account.account_type
  const creditType = creditLine.account.account_type

  if (debitType === 'ASSET' && creditType === 'REVENUE') return 'INCOME'
  if (debitType === 'EXPENSE' && creditType === 'ASSET') return 'EXPENSE'
  if (debitType === 'ASSET' && creditType === 'LIABILITY') return 'ASSET_PURCHASE'
  if (debitType === 'LIABILITY' && creditType === 'ASSET') return 'LIABILITY_PAYMENT'
  if (debitType === 'ASSET' && creditType === 'EQUITY') return 'EQUITY_FUNDING'

  return 'CUSTOM'
}

function getTransactionPrimaryLine(
  transaction: AccountingTransactionList,
  direction: 'debit' | 'credit'
): AccountingTransactionLine | null {
  const lines = transaction.lines || []

  return (
    lines.find(line =>
      direction === 'debit' ? normalizeAmount(line.debit_amount) > 0 : normalizeAmount(line.credit_amount) > 0
    ) || null
  )
}

function getTransactionAdditionalLineCount(
  transaction: AccountingTransactionList,
  direction: 'debit' | 'credit'
): number {
  const lines = transaction.lines || []
  const matchingLines = lines.filter(line =>
    direction === 'debit' ? normalizeAmount(line.debit_amount) > 0 : normalizeAmount(line.credit_amount) > 0
  )

  return Math.max(0, matchingLines.length - 1)
}

function formatTransactionAccount(line: AccountingTransactionLine | null): string {
  if (!line) return '-'
  return `${line.account.code} - ${line.account.name}`
}

function normalizeParentId(parentName: string): number | null {
  if (!parentName) return null
  return accountStore.accountOptions.find(account => account.name === parentName)?.id || null
}

async function refreshAccounts(params: ChartOfAccountListParams = {}): Promise<void> {
  const resolvedSearch = (params.search ?? accountFilters.value.search) || undefined
  const resolvedAccountTypes =
    params.account_type !== undefined
      ? [params.account_type]
      : accountFilters.value.account_type
  const resolvedIsActive =
    params.is_active !== undefined
      ? params.is_active
      : accountFilters.value.status === ''
        ? undefined
        : accountFilters.value.status === 'true'

  const requestParams = {
    page: params.page || accountStore.pagination.page,
    search: resolvedSearch,
    is_active: resolvedIsActive,
    ordering: params.ordering || 'code'
  }

  if (resolvedAccountTypes.length > 1) {
    await accountStore.fetchAccountsByTypes(resolvedAccountTypes, requestParams)
    return
  }

  await accountStore.fetchAccounts({
    ...requestParams,
    account_type: resolvedAccountTypes[0]
  })
}

async function refreshTransactions(params: AccountingTransactionListParams = {}): Promise<void> {
  const resolvedSearch = (params.search ?? transactionFilters.value.search) || undefined
  const resolvedStatus = (params.status ?? transactionFilters.value.status) || undefined
  const resolvedAccount = params.account ?? (transactionFilters.value.account ? Number(transactionFilters.value.account) : undefined)
  const resolvedDateMin = (params.transaction_date_min ?? transactionFilters.value.transaction_date_min) || undefined
  const resolvedDateMax = (params.transaction_date_max ?? transactionFilters.value.transaction_date_max) || undefined

  await accountStore.fetchTransactions({
    page: params.page || accountStore.transactionPagination.page,
    search: resolvedSearch,
    status: resolvedStatus,
    account: resolvedAccount,
    transaction_date_min: resolvedDateMin,
    transaction_date_max: resolvedDateMax,
    ordering: params.ordering || '-transaction_date'
  })
}

async function loadPage(): Promise<void> {
  await Promise.all([
    refreshAccounts({ page: 1 }),
    refreshTransactions({ page: 1 }),
    accountStore.fetchAccountOptions(),
    accountStore.fetchTransactionStatuses()
  ])
}

function openCreateAccountModal(): void {
  editingAccountId.value = null
  accountForm.value = createEmptyAccountForm()
  accountStore.clearError()
  showAccountModal.value = true
}

async function openEditAccountModal(account: ChartOfAccountList): Promise<void> {
  editingAccountId.value = account.id
  accountStore.clearError()

  const detail = await accountStore.getAccountById(account.id)
  if (!detail) return

  accountForm.value = {
    code: detail.code,
    name: detail.name,
    account_type: detail.account_type,
    parent: normalizeParentId(detail.parent)?.toString() || '',
    description: detail.description || '',
    is_active: detail.is_active ? 'true' : 'false'
  }

  showAccountModal.value = true
}

async function handleSaveAccount(): Promise<void> {
  const payload = {
    code: accountForm.value.code.trim(),
    name: accountForm.value.name.trim(),
    account_type: accountForm.value.account_type,
    parent: accountForm.value.parent ? Number(accountForm.value.parent) : null,
    description: accountForm.value.description.trim() || null,
    is_active: accountForm.value.is_active === 'true'
  }

  if (!payload.code || !payload.name) return

  const success = editingAccountId.value
    ? await accountStore.updateAccount(editingAccountId.value, payload)
    : await accountStore.createAccount(payload)

  if (!success) return

  showAccountModal.value = false
  await refreshAccounts({ page: editingAccountId.value ? accountStore.pagination.page : 1 })
}

function promptDeleteAccount(account: ChartOfAccountList): void {
  showAccountModal.value = false
  accountPendingDelete.value = account
  showDeleteAccountModal.value = true
}

async function handleDeleteAccount(): Promise<void> {
  if (!accountPendingDelete.value) return

  const success = await accountStore.deleteAccount(accountPendingDelete.value.id)
  if (!success) return

  showDeleteAccountModal.value = false
  accountPendingDelete.value = null
}

function openCreateTransactionModal(): void {
  editingTransactionId.value = null
  transactionForm.value = createEmptyTransactionForm()
  accountStore.clearError()
  showTransactionModal.value = true
}

function populateTransactionForm(): void {
  const transaction = accountStore.currentTransaction
  if (!transaction) return

  const transactionType = inferTransactionType(transaction.lines)

  transactionForm.value = {
    transaction_type: transactionType,
    transaction_date: transaction.transaction_date,
    reference: transaction.reference || '',
    description: transaction.description || '',
    lines: transaction.lines.length
      ? transaction.lines.map(line => ({
          account_id: String(line.account.id),
          description: line.description || '',
          debit_amount: line.debit_amount && line.debit_amount !== '0.00' ? line.debit_amount : '',
          credit_amount: line.credit_amount && line.credit_amount !== '0.00' ? line.credit_amount : ''
        }))
      : createPresetLines()
  }

  ensurePresetLines(transactionType)
}

async function openEditTransactionModal(transaction: AccountingTransactionList): Promise<void> {
  editingTransactionId.value = transaction.id
  accountStore.clearError()

  const detail = await accountStore.getTransactionById(transaction.id)
  if (!detail) return

  populateTransactionForm()
  showTransactionModal.value = true
}

function addTransactionLine(): void {
  transactionForm.value.lines.push(createEmptyTransactionLine())
}

function removeTransactionLine(index: number): void {
  if (transactionForm.value.lines.length <= 2) return
  transactionForm.value.lines.splice(index, 1)
}

function buildTransactionPayload() {
  const lines = transactionForm.value.lines
    .map(line => ({
      account_id: Number(line.account_id),
      description: line.description.trim() || null,
      debit_amount: normalizeAmount(line.debit_amount) ? normalizeAmount(line.debit_amount).toFixed(2) : '0.00',
      credit_amount: normalizeAmount(line.credit_amount) ? normalizeAmount(line.credit_amount).toFixed(2) : '0.00'
    }))
    .filter(line => Number.isFinite(line.account_id) && line.account_id > 0)

  const hasInvalidLine = lines.some(line =>
    line.account_id <= 0 ||
    (line.debit_amount === '0.00' && line.credit_amount === '0.00') ||
    (line.debit_amount !== '0.00' && line.credit_amount !== '0.00')
  )
  if (lines.length < 2 || hasInvalidLine || !lineTotals.value.balanced) {
    return null
  }

  return {
    transaction_date: transactionForm.value.transaction_date,
    reference: transactionForm.value.reference.trim() || null,
    description: transactionForm.value.description.trim() || null,
    lines
  }
}

async function handleSaveTransaction(): Promise<void> {
  const payload = buildTransactionPayload()
  if (!payload || !payload.transaction_date) return

  const success = editingTransactionId.value
    ? await accountStore.updateTransaction(editingTransactionId.value, payload)
    : await accountStore.createTransaction(payload)

  if (!success) return

  showTransactionModal.value = false
  await refreshTransactions({ page: editingTransactionId.value ? accountStore.transactionPagination.page : 1 })
}

async function handlePostTransaction(): Promise<void> {
  if (!editingTransactionId.value) return

  const payload = {
    transaction_date: transactionForm.value.transaction_date,
    reference: transactionForm.value.reference.trim() || null,
    description: transactionForm.value.description.trim() || null
  }

  const success = await accountStore.postTransaction(editingTransactionId.value, payload)
  if (!success) return

  populateTransactionForm()
  await refreshTransactions({ page: accountStore.transactionPagination.page })
}

function promptDeleteTransaction(transaction: AccountingTransactionList): void {
  showTransactionModal.value = false
  transactionPendingDelete.value = transaction
  showDeleteTransactionModal.value = true
}

async function handleDeleteTransaction(): Promise<void> {
  if (!transactionPendingDelete.value) return

  const success = await accountStore.deleteTransaction(transactionPendingDelete.value.id)
  if (!success) return

  showDeleteTransactionModal.value = false
  transactionPendingDelete.value = null
}

async function resetAccountFilters(): Promise<void> {
  suppressAccountFilterWatch.value = true
  if (accountSearchDebounceTimer) {
    clearTimeout(accountSearchDebounceTimer)
    accountSearchDebounceTimer = null
  }
  accountFilters.value = {
    search: '',
    account_type: [],
    status: ''
  }
  accountStore.setPage(1)
  await refreshAccounts({ page: 1, search: undefined, account_type: undefined, is_active: undefined })
  suppressAccountFilterWatch.value = false
}

async function applyTransactionFilters(): Promise<void> {
  accountStore.setTransactionPage(1)
  await refreshTransactions({ page: 1 })
}

async function resetTransactionFilters(): Promise<void> {
  transactionFilters.value = {
    search: '',
    status: '',
    account: '',
    transaction_date_min: '',
    transaction_date_max: ''
  }
  accountStore.setTransactionPage(1)
  await refreshTransactions({
    page: 1,
    search: undefined,
    status: undefined,
    account: undefined,
    transaction_date_min: undefined,
    transaction_date_max: undefined
  })
}

async function goToAccountPage(page: number): Promise<void> {
  if (page < 1) return
  accountStore.setPage(page)
  await refreshAccounts({ page })
}

async function goToTransactionPage(page: number): Promise<void> {
  if (page < 1) return
  accountStore.setTransactionPage(page)
  await refreshTransactions({ page })
}

onMounted(() => {
  void loadPage()
})

watch(
  () => accountFilters.value.search,
  value => {
    if (suppressAccountFilterWatch.value) return
    if (accountSearchDebounceTimer) clearTimeout(accountSearchDebounceTimer)

    accountSearchDebounceTimer = setTimeout(() => {
      accountStore.setPage(1)
      void refreshAccounts({ page: 1, search: value || undefined })
    }, 250)
  }
)

watch(
  () => [accountFilters.value.account_type, accountFilters.value.status],
  () => {
    if (suppressAccountFilterWatch.value) return
    accountStore.setPage(1)
    void refreshAccounts({ page: 1 })
  }
)

function toggleAccountTypeFilter(value: '' | AccountType): void {
  if (!value) {
    accountFilters.value.account_type = []
    return
  }

  if (accountFilters.value.account_type.includes(value)) {
    accountFilters.value.account_type = accountFilters.value.account_type.filter(type => type !== value)
    return
  }

  accountFilters.value.account_type = [...accountFilters.value.account_type, value]
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Accounting Workflow</h1>
        <p class="mt-1 text-gray-500">
          Chart of accounts and accounting transactions are API-backed, including draft entry posting.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          @click="loadPage"
        >
          Refresh
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          @click="openCreateAccountModal"
        >
          Add Account
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          @click="openCreateTransactionModal"
        >
          Add Transaction
        </button>
      </div>
    </div>

    <div v-if="accountStore.error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ accountStore.error }}
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard
        v-for="stat in moduleStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1fr]">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 class="text-lg font-semibold text-gray-900">Current Movement</h2>
        <p class="mt-1 text-sm text-gray-500">Totals are calculated from the transactions loaded in the current list view.</p>
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div v-for="item in movementStats" :key="item.label" class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ item.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">৳{{ formatCurrency(item.value) }}</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="item in typeSummary"
            :key="item.label"
            class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ item.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900">{{ item.value }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 class="text-lg font-semibold text-gray-900">Accounting Module Plan</h2>
        <p class="mt-1 text-sm text-gray-500">Remaining implementation sequence based on the current backend coverage.</p>
        <ul class="mt-4 space-y-3">
          <li v-for="item in roadmap" :key="item.title" class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-gray-900">{{ item.title }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ item.description }}</p>
              </div>
              <span class="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                {{ item.status }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'accounts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
            @click="activeTab = 'accounts'"
          >
            Chart of Accounts
          </button>
          <button
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'transactions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
            @click="activeTab = 'transactions'"
          >
            Transactions
          </button>
          <button
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'roadmap'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
            @click="activeTab = 'roadmap'"
          >
            Roadmap
          </button>
        </nav>
      </div>

      <div v-if="activeTab === 'accounts'" class="p-6 space-y-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div class="min-w-0 lg:flex-1">
            <FormInput
              v-model="accountFilters.search"
              label="Search"
              placeholder="Search by code or account name"
            />
          </div>
          <div class="shrink-0">
            <label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <div class="inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1">
              <button
                v-for="option in accountFilterTypePills"
                :key="option.value"
                type="button"
                :title="option.label"
                :aria-label="option.label"
                :class="[
                  'group relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  (option.value === '' && accountFilters.account_type.length === 0) || accountFilters.account_type.includes(option.value)
                    ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                    : 'border-transparent bg-white text-gray-600 hover:border-gray-200 hover:text-gray-900'
                ]"
                @click="toggleAccountTypeFilter(option.value)"
              >
                <span
                  :class="[
                    'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold',
                    ((option.value === '' && accountFilters.account_type.length === 0) || accountFilters.account_type.includes(option.value))
                      ? 'bg-white/20 text-white'
                      : option.badgeClass
                  ]"
                >
                  {{ option.badge }}
                </span>
                <span
                  class="pointer-events-none absolute -bottom-9 left-1/2 z-10 -translate-x-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                >
                  {{ option.label }}
                </span>
              </button>
            </div>
          </div>
          <div class="shrink-0 lg:w-44">
            <FormSelect
              v-model="accountFilters.status"
              label="Status"
              :options="accountStatusFilterOptions"
            />
          </div>
          <div class="flex items-end gap-2 shrink-0">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              @click="resetAccountFilters"
            >
              Reset
            </button>
          </div>
        </div>

        <DataTable
          :columns="accountColumns"
          :data="accountStore.accounts"
          :loading="accountStore.loading"
          @row-click="openEditAccountModal"
        >
          <template #code="{ value }">
            <span class="font-mono text-sm text-gray-600">{{ value }}</span>
          </template>

          <template #account_type="{ value }">
            <StatusBadge :status="value" />
          </template>

          <template #parent="{ value }">
            <span class="text-sm text-gray-600">{{ value || 'Root account' }}</span>
          </template>

          <template #is_active="{ value }">
            <StatusBadge :status="value ? 'ACTIVE' : 'INACTIVE'" size="sm" />
          </template>
        </DataTable>

        <div class="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-gray-500">
            Showing page {{ accountStore.pagination.page }} of
            {{ Math.max(1, Math.ceil(accountStore.pagination.count / accountStore.pagination.pageSize)) }}
          </p>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!accountStore.pagination.hasPrevious || accountStore.loading"
              @click="goToAccountPage(accountStore.pagination.page - 1)"
            >
              Previous
            </button>
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!accountStore.pagination.hasNext || accountStore.loading"
              @click="goToAccountPage(accountStore.pagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'transactions'" class="p-6 space-y-6">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <FormInput
            v-model="transactionFilters.search"
            label="Search"
            placeholder="Search by description or reference"
          />
          <FormSelect
            v-model="transactionFilters.account"
            label="Account"
            :options="accountSelectOptions"
          />
          <FormSelect
            v-model="transactionFilters.status"
            label="Status"
            :options="transactionStatusFilterOptions"
          />
          <FormInput
            v-model="transactionFilters.transaction_date_min"
            label="Date From"
            type="date"
          />
          <FormInput
            v-model="transactionFilters.transaction_date_max"
            label="Date To"
            type="date"
          />
        </div>

        <div class="flex gap-2">
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            @click="applyTransactionFilters"
          >
            Apply Filters
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            @click="resetTransactionFilters"
          >
            Reset
          </button>
        </div>

        <DataTable
          :columns="transactionColumns"
          :data="accountStore.transactions"
          :loading="accountStore.transactionLoading"
          @row-click="openEditTransactionModal"
        >
          <template #transaction_no="{ value, row }">
            <div>
              <div class="font-mono text-sm text-gray-700">{{ value || `Draft #${row.id}` }}</div>
              <div class="text-xs text-gray-500">ID: {{ row.id }}</div>
            </div>
          </template>

          <template #transaction_date="{ value }">
            {{ new Date(value).toLocaleDateString() }}
          </template>

          <template #debit_account="{ row }">
            <div class="whitespace-normal">
              <div class="text-sm text-gray-800">{{ formatTransactionAccount(getTransactionPrimaryLine(row, 'debit')) }}</div>
              <div
                v-if="getTransactionAdditionalLineCount(row, 'debit')"
                class="text-xs text-gray-500"
              >
                +{{ getTransactionAdditionalLineCount(row, 'debit') }} more debit line<span v-if="getTransactionAdditionalLineCount(row, 'debit') > 1">s</span>
              </div>
            </div>
          </template>

          <template #credit_account="{ row }">
            <div class="whitespace-normal">
              <div class="text-sm text-gray-800">{{ formatTransactionAccount(getTransactionPrimaryLine(row, 'credit')) }}</div>
              <div
                v-if="getTransactionAdditionalLineCount(row, 'credit')"
                class="text-xs text-gray-500"
              >
                +{{ getTransactionAdditionalLineCount(row, 'credit') }} more credit line<span v-if="getTransactionAdditionalLineCount(row, 'credit') > 1">s</span>
              </div>
            </div>
          </template>

          <template #reference="{ value }">
            <span class="font-mono text-xs text-gray-500">{{ value || '-' }}</span>
          </template>

          <template #description="{ value }">
            <span class="text-sm text-gray-700">{{ value || '-' }}</span>
          </template>

          <template #status="{ value }">
            <StatusBadge :status="value || accountStore.defaultTransactionStatus" size="sm" />
          </template>

          <template #total_debit="{ value }">
            <span class="font-medium text-red-600">৳{{ formatCurrency(value) }}</span>
          </template>

          <template #total_credit="{ value }">
            <span class="font-medium text-green-600">৳{{ formatCurrency(value) }}</span>
          </template>
        </DataTable>

        <div class="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-gray-500">
            Showing page {{ accountStore.transactionPagination.page }} of
            {{ Math.max(1, Math.ceil(accountStore.transactionPagination.count / accountStore.transactionPagination.pageSize)) }}
          </p>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!accountStore.transactionPagination.hasPrevious || accountStore.transactionLoading"
              @click="goToTransactionPage(accountStore.transactionPagination.page - 1)"
            >
              Previous
            </button>
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!accountStore.transactionPagination.hasNext || accountStore.transactionLoading"
              @click="goToTransactionPage(accountStore.transactionPagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-6">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div v-for="item in roadmap" :key="item.title" class="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-gray-900">{{ item.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-gray-500">{{ item.description }}</p>
              </div>
              <span class="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
                {{ item.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FormModal
      :show="showAccountModal"
      :title="editingAccountId ? 'Edit Account' : 'Add New Account'"
      @close="showAccountModal = false"
      @submit="handleSaveAccount"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            v-model="accountForm.code"
            label="Account Code"
            placeholder="e.g. 1100"
          />
          <FormInput
            v-model="accountForm.name"
            label="Account Name"
            placeholder="e.g. Cash in Bank"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect
            v-model="accountForm.account_type"
            label="Account Type"
            :options="accountTypeOptions"
          />
          <FormSelect
            v-model="accountForm.parent"
            label="Parent Account"
            :options="parentOptions"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect
            v-model="accountForm.is_active"
            label="Status"
            :options="accountStatusOptions"
          />
          <FormInput
            v-model="accountForm.description"
            label="Description"
            placeholder="Optional account notes"
          />
        </div>

        <div
          v-if="editingAccountId"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Parent editing is inferred from the current list because the account detail API returns the parent name, not the parent ID.
        </div>

        <div v-if="editingAccountId" class="flex justify-end">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            @click="editingAccount && promptDeleteAccount(editingAccount)"
          >
            Delete Account
          </button>
        </div>
      </div>
    </FormModal>

    <FormModal
      :show="showTransactionModal"
      :title="editingTransactionId ? 'Edit Transaction' : 'Add Transaction'"
      size="xl"
      @close="showTransactionModal = false"
      @submit="handleSaveTransaction"
    >
      <div class="space-y-5">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormSelect
            :model-value="transactionForm.transaction_type"
            label="Transaction Type"
            :options="transactionTypeOptions"
            @update:model-value="handleTransactionTypeChange"
          />
          <FormInput
            v-model="transactionForm.transaction_date"
            label="Transaction Date"
            type="date"
          />
          <FormInput
            v-model="transactionForm.reference"
            label="Reference"
            placeholder="Invoice / voucher ref"
          />
          <FormInput
            v-model="transactionForm.description"
            label="Description"
            placeholder="Narration"
          />
        </div>

        <div
          v-if="selectedTransactionPreset"
          class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ selectedTransactionPreset.description }}</p>
            <p class="mt-1 text-xs text-gray-500">
              This entry uses two COA selections only and auto-builds the matching debit and credit lines.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              v-model="transactionForm.lines[0].account_id"
              :label="selectedTransactionPreset.debitLabel"
              :options="debitAccountOptions"
              placeholder="Select debit-side account"
            />
            <FormSelect
              v-model="transactionForm.lines[1].account_id"
              :label="selectedTransactionPreset.creditLabel"
              :options="creditAccountOptions"
              placeholder="Select credit-side account"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput
              v-model="presetAmount"
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
            <FormInput
              v-model="transactionForm.lines[0].description"
              :label="`${selectedTransactionPreset.debitLabel} Note`"
              placeholder="Optional line note"
            />
            <FormInput
              v-model="transactionForm.lines[1].description"
              :label="`${selectedTransactionPreset.creditLabel} Note`"
              placeholder="Optional line note"
            />
          </div>
        </div>

        <div v-else class="rounded-lg border border-gray-200 overflow-hidden">
          <div class="grid grid-cols-[2fr,2fr,1.5fr,1.5fr,auto] gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <span>Account</span>
            <span>Description</span>
            <span>Debit</span>
            <span>Credit</span>
            <span></span>
          </div>

          <div class="divide-y divide-gray-200">
            <div
              v-for="(line, index) in transactionForm.lines"
              :key="index"
              class="grid grid-cols-[2fr,2fr,1.5fr,1.5fr,auto] gap-3 px-4 py-3"
            >
              <select
                v-model="line.account_id"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="" disabled>Select an account</option>
                <option v-for="option in accountSelectOptions.slice(1)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>

              <input
                v-model="line.description"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Line description"
              />

              <input
                v-model="line.debit_amount"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />

              <input
                v-model="line.credit_amount"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />

              <button
                type="button"
                class="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="transactionForm.lines.length <= 2"
                @click="removeTransactionLine(index)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <button
            v-if="!selectedTransactionPreset"
            type="button"
            class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            @click="addTransactionLine"
          >
            Add Line
          </button>

          <div class="flex flex-wrap gap-4 text-sm">
            <span class="text-red-600 font-medium">Debit: ৳{{ formatCurrency(lineTotals.debit) }}</span>
            <span class="text-green-600 font-medium">Credit: ৳{{ formatCurrency(lineTotals.credit) }}</span>
            <span :class="lineTotals.balanced ? 'text-green-600' : 'text-red-600'" class="font-medium">
              {{ lineTotals.balanced ? 'Balanced entry' : 'Debits and credits must match' }}
            </span>
          </div>
        </div>

        <div
          v-if="editingTransactionId && accountStore.currentTransaction"
          class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
        >
          <div class="flex flex-wrap gap-4">
            <span>Transaction No: <strong class="text-gray-900">{{ accountStore.currentTransaction.transaction_no || `Draft #${accountStore.currentTransaction.id}` }}</strong></span>
            <span>Status: <strong class="text-gray-900">{{ accountStore.currentTransaction.status }}</strong></span>
            <span>Total Debit: <strong class="text-gray-900">৳{{ formatCurrency(accountStore.currentTransaction.total_debit) }}</strong></span>
            <span>Total Credit: <strong class="text-gray-900">৳{{ formatCurrency(accountStore.currentTransaction.total_credit) }}</strong></span>
          </div>
        </div>
      </div>

      <template #actions>
        <div class="flex flex-wrap justify-between gap-3 w-full">
          <div>
            <button
              v-if="editingTransactionId"
              type="button"
              class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              @click="editingTransaction && promptDeleteTransaction(editingTransaction)"
            >
              Delete
            </button>
          </div>

          <div class="flex gap-3">
            <button
              v-if="editingTransactionId && editableTransaction"
              type="button"
              class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              @click="handlePostTransaction"
            >
              Post Transaction
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </template>
    </FormModal>

    <ConfirmModal
      :show="showDeleteAccountModal"
      title="Delete Account"
      :message="`Delete ${accountPendingDelete?.code || ''} ${accountPendingDelete?.name || ''}? This cannot be undone.`"
      confirm-text="Delete"
      @cancel="showDeleteAccountModal = false"
      @confirm="handleDeleteAccount"
    />

    <ConfirmModal
      :show="showDeleteTransactionModal"
      title="Delete Transaction"
      :message="`Delete ${transactionPendingDelete?.transaction_no || `Draft #${transactionPendingDelete?.id || ''}`}? This cannot be undone.`"
      confirm-text="Delete"
      @cancel="showDeleteTransactionModal = false"
      @confirm="handleDeleteTransaction"
    />
  </div>
</template>
