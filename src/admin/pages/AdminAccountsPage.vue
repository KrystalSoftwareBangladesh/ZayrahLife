<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import StatCard from '@/components/admin/StatCard.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useAccountStore } from '@/stores/admin/accountStore'
import { useTransactionTypesStore } from '@/stores/admin/transactionTypesStore'
import type {
  AccountType,
  ChartOfAccountDetail,
  AccountingTransactionDetail,
  AccountingTransactionList,
  AccountingTransactionListParams,
  ChartOfAccountList,
  ChartOfAccountListParams,
  TransactionStatus
} from '@/api/types'

type AccountFormState = {
  name: string
  account_type: AccountType
  parent: string
  description: string
  is_active: 'true' | 'false'
  create_opening_balance_now: boolean
  opening_balance: string
  opening_date: string
  opening_contra_account_id: string
}

type TransactionLineFormState = {
  account_id: string
  description: string
  debit_amount: string
  credit_amount: string
}

type TransactionEntryType = string

type TransactionFormState = {
  transaction_type: TransactionEntryType
  transaction_date: string
  reference: string
  description: string
  lines: TransactionLineFormState[]
}

type AccountingTab = 'accounts' | 'transactions' | 'roadmap'
type AccountCreationContext = {
  accountType: AccountType | null
}

const BUSINESS_DATE = '2026-03-17'
const OPENING_BALANCE_PROMPT_TYPES: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY']
const IMPORTANT_OPENING_BALANCE_KEYWORDS = ['bank', 'cash', 'inventory', 'payable', 'capital', 'owner']

const accountStore = useAccountStore()
const transactionTypesStore = useTransactionTypesStore()
const route = useRoute()
const router = useRouter()

const activeTab = ref<AccountingTab>('accounts')

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
const accountFormValidationMessage = ref('')
const accountFormSuccessMessage = ref('')
const suppressAccountFilterWatch = ref(false)
const suppressTransactionFilterWatch = ref(false)
const suppressRouteSync = ref(false)
const accountCreationContext = ref<AccountCreationContext | null>(null)
let accountSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null
let transactionSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null

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

const transactionTypeOptions = computed(() => transactionTypesStore.typeOptions)

const transactionTypePresets = computed(() => transactionTypesStore.typePresets)

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
      .filter(account => account.id !== currentId && account.account_type === accountForm.value.account_type)
      .map(account => ({
        value: String(account.id),
        label: `${account.code} - ${account.name}`
      }))
  ]
})

const supportsOpeningBalance = computed(() =>
  OPENING_BALANCE_PROMPT_TYPES.includes(accountForm.value.account_type)
)

const canManageOpeningBalanceInForm = computed(() => supportsOpeningBalance.value && !editingAccountId.value)

const hasExistingOpeningBalance = computed(() => {
  const currentAccount = accountStore.currentAccount
  if (!currentAccount) return false

  return !!(currentAccount.opening_balance && normalizeAmount(currentAccount.opening_balance) > 0)
})

const shouldHighlightOpeningBalance = computed(() => {
  if (!supportsOpeningBalance.value) return false
  const normalizedName = accountForm.value.name.trim().toLowerCase()
  return IMPORTANT_OPENING_BALANCE_KEYWORDS.some(keyword => normalizedName.includes(keyword))
})

const openingContraAccounts = computed(() =>
  accountStore.accountOptions.filter(account => account.account_type === 'EQUITY' && account.is_active)
)

const openingContraAccountOptions = computed(() => [
  { value: '', label: 'Select contra account' },
  ...openingContraAccounts.value.map(account => ({
    value: String(account.id),
    label: `${account.code} - ${account.name}`
  }))
])

const openingBalancePreviewText = computed(() => {
  if (!supportsOpeningBalance.value) return ''
  if (!accountForm.value.create_opening_balance_now) return 'Leave this off if the account starts at zero.'

  const amount = normalizeAmount(accountForm.value.opening_balance)
  if (amount <= 0) return 'Enter an amount above zero to create the opening journal entry.'

  const contraAccount = openingContraAccounts.value.find(
    account => String(account.id) === accountForm.value.opening_contra_account_id
  )
  const contraLabel = contraAccount?.name || 'the default contra account'

  if (accountForm.value.account_type === 'ASSET') {
    return `This will debit this account and credit ${contraLabel}.`
  }

  return `This will credit this account and debit ${contraLabel}.`
})

const accountNeedsOpeningBalanceBanner = computed(() =>
  !!editingAccountId.value && supportsOpeningBalance.value && !hasExistingOpeningBalance.value
)

const existingOpeningBalanceSummary = computed(() => {
  const currentAccount = accountStore.currentAccount
  if (!currentAccount?.opening_balance) return null

  const amount = normalizeAmount(currentAccount.opening_balance)
  if (amount <= 0) return null

  return {
    amount,
    date: currentAccount.opening_date || '',
    contraAccountName: currentAccount.opening_contra_account_name || '',
    transactionId: currentAccount.opening_transaction?.id || null,
    transactionNo: currentAccount.opening_transaction?.transaction_no || null
  }
})

const accountSubmitLabel = computed(() => {
  if (editingAccountId.value) return 'Save Account Changes'
  if (canManageOpeningBalanceInForm.value && accountForm.value.create_opening_balance_now) {
    return 'Save Account and Opening Balance'
  }
  return 'Save Account'
})

const selectedTransactionAccountName = computed(() => {
  if (!transactionFilters.value.account) return ''
  return accountStore.accountOptions.find(account => String(account.id) === transactionFilters.value.account)?.name || ''
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
  accountStore.accounts.find(account => account.id === editingAccountId.value) ||
  (accountStore.currentAccount
    ? {
        id: accountStore.currentAccount.id,
        code: accountStore.currentAccount.code,
        name: accountStore.currentAccount.name,
        account_type: accountStore.currentAccount.account_type,
        parent: accountStore.currentAccount.parent,
        is_active: accountStore.currentAccount.is_active
      }
    : null)
)

const editingTransaction = computed(() =>
  accountStore.transactions.find(transaction => transaction.id === editingTransactionId.value) || accountStore.currentTransaction || null
)

const selectedTransactionPreset = computed(() => transactionTypesStore.getPresetByValue(transactionForm.value.transaction_type) || null)

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
    if (!selectedTransactionPreset.value) return
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

function formatDisplayDate(value: string | undefined): string {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-CA')
}

function normalizeAmount(value: string | undefined): number {
  const parsed = Number.parseFloat(value || '0')
  return Number.isFinite(parsed) ? parsed : 0
}

function isFutureBusinessDate(value: string): boolean {
  return !!value && value > BUSINESS_DATE
}

function findDefaultOpeningContraAccountId(): string {
  const exactMatch = openingContraAccounts.value.find(account =>
    account.name.trim().toLowerCase() === 'opening balance equity'
  )

  if (exactMatch) return String(exactMatch.id)

  const partialMatch = openingContraAccounts.value.find(account =>
    account.name.trim().toLowerCase().includes('opening balance')
  )

  if (partialMatch) return String(partialMatch.id)

  return openingContraAccounts.value[0] ? String(openingContraAccounts.value[0].id) : ''
}

function createEmptyAccountForm(): AccountFormState {
  return {
    name: '',
    account_type: 'ASSET',
    parent: '',
    description: '',
    is_active: 'true',
    create_opening_balance_now: false,
    opening_balance: '',
    opening_date: BUSINESS_DATE,
    opening_contra_account_id: ''
  }
}

function createAccountFormFromContext(context: AccountCreationContext | null = null): AccountFormState {
  const form = {
    ...createEmptyAccountForm(),
    account_type: context?.accountType || 'ASSET'
  }

  if (OPENING_BALANCE_PROMPT_TYPES.includes(form.account_type)) {
    form.opening_contra_account_id = findDefaultOpeningContraAccountId()
  }

  return form
}

function createAccountFormFromDetail(detail: ChartOfAccountDetail): AccountFormState {
  const form = {
    name: detail.name,
    account_type: detail.account_type,
    parent: normalizeParentId(detail.parent)?.toString() || '',
    description: detail.description || '',
    is_active: detail.is_active ? 'true' : 'false',
    create_opening_balance_now: false,
    opening_balance: '',
    opening_date: detail.opening_date || BUSINESS_DATE,
    opening_contra_account_id: detail.opening_contra_account_id ? String(detail.opening_contra_account_id) : ''
  } satisfies AccountFormState

  if (OPENING_BALANCE_PROMPT_TYPES.includes(form.account_type) && !form.opening_contra_account_id) {
    form.opening_contra_account_id = findDefaultOpeningContraAccountId()
  }

  return form
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
  const initialType = getDefaultTransactionType()

  return {
    transaction_type: initialType,
    transaction_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: createInitialTransactionLines(initialType)
  }
}

function createInitialTransactionLines(type: TransactionEntryType): TransactionLineFormState[] {
  return transactionTypesStore.getPresetByValue(type)
    ? createPresetLines()
    : [createEmptyTransactionLine(), createEmptyTransactionLine()]
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

function getDefaultTransactionType(): TransactionEntryType {
  if (transactionTypesStore.getTypeByValue(transactionTypesStore.defaultType)) {
    return transactionTypesStore.defaultType
  }

  return transactionTypesStore.typeOptions[0]?.value || 'CUSTOM'
}

function getFreeformTransactionType(preferredType?: string): TransactionEntryType {
  if (preferredType && transactionTypesStore.getTypeByValue(preferredType) && !transactionTypesStore.getPresetByValue(preferredType)) {
    return preferredType
  }

  const defaultType = getDefaultTransactionType()
  if (!transactionTypesStore.getPresetByValue(defaultType)) {
    return defaultType
  }

  const freeformOption = transactionTypesStore.typeOptions.find(option => !transactionTypesStore.getPresetByValue(option.value))
  return freeformOption?.value || 'CUSTOM'
}

function ensurePresetLines(type: TransactionEntryType): void {
  const preset = transactionTypesStore.getPresetByValue(type)
  if (!preset) {
    if (!transactionForm.value.lines.length) {
      transactionForm.value.lines = [createEmptyTransactionLine(), createEmptyTransactionLine()]
    }
    return
  }

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
  if (lines.length !== 2) return getFreeformTransactionType()

  const debitLine = lines.find(line => normalizeAmount(line.debit_amount) > 0 && normalizeAmount(line.credit_amount) === 0)
  const creditLine = lines.find(line => normalizeAmount(line.credit_amount) > 0 && normalizeAmount(line.debit_amount) === 0)

  if (!debitLine || !creditLine) return getFreeformTransactionType()

  const debitType = debitLine.account.account_type
  const creditType = creditLine.account.account_type

  const matchingTypes = Object.entries(transactionTypePresets.value).filter(([, preset]) =>
    preset.debitAccountTypes.includes(debitType) &&
    preset.creditAccountTypes.includes(creditType)
  )

  if (matchingTypes.length === 1) {
    return matchingTypes[0][0]
  }

  return getFreeformTransactionType()
}

function getTransactionPrimaryLine(
  transaction: AccountingTransactionList,
  direction: 'debit' | 'credit'
): string {
  const account = direction === 'debit'
    ? transaction.primary_debit_account
    : transaction.primary_credit_account

  if (!account) return '-'
  return `${account.code} - ${account.name}`
}

function getTransactionAdditionalLineCount(
  transaction: AccountingTransactionList,
  direction: 'debit' | 'credit'
): number {
  const lineCount = direction === 'debit'
    ? transaction.debit_line_count
    : transaction.credit_line_count

  return Math.max(0, Number(lineCount || 0) - 1)
}

function normalizeParentId(parentName: string): number | null {
  if (!parentName) return null
  return accountStore.accountOptions.find(account => account.name === parentName)?.id || null
}

function normalizeAccountingTab(value: unknown): AccountingTab {
  return value === 'transactions' || value === 'roadmap' ? value : 'accounts'
}

function parseQueryId(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

async function syncRouteState(): Promise<void> {
  if (suppressRouteSync.value) return

  const nextQuery = { ...route.query }
  nextQuery.tab = activeTab.value

  if (showAccountModal.value && editingAccountId.value) {
    nextQuery.account = String(editingAccountId.value)
  } else {
    delete nextQuery.account
  }

  if (showTransactionModal.value && editingTransactionId.value) {
    nextQuery.transaction = String(editingTransactionId.value)
  } else {
    delete nextQuery.transaction
  }

  if (activeTab.value !== 'accounts') delete nextQuery.account
  if (activeTab.value !== 'transactions') delete nextQuery.transaction

  const currentTab = typeof route.query.tab === 'string' ? route.query.tab : undefined
  const currentAccount = typeof route.query.account === 'string' ? route.query.account : undefined
  const currentTransaction = typeof route.query.transaction === 'string' ? route.query.transaction : undefined

  if (
    currentTab === nextQuery.tab &&
    currentAccount === nextQuery.account &&
    currentTransaction === nextQuery.transaction
  ) {
    return
  }

  suppressRouteSync.value = true
  await router.replace({ query: nextQuery })
  suppressRouteSync.value = false
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
    ordering: params.ordering || '-transaction_datetime'
  })
}

async function loadPage(): Promise<void> {
  await Promise.all([
    refreshAccounts({ page: 1 }),
    refreshTransactions({ page: 1 }),
    accountStore.fetchAccountOptions(),
    accountStore.fetchTransactionStatuses(),
    transactionTypesStore.loadTypes()
  ])
}

function closeAccountModal(): void {
  showAccountModal.value = false
  editingAccountId.value = null
  accountCreationContext.value = null
  accountFormValidationMessage.value = ''
}

function closeTransactionModal(): void {
  showTransactionModal.value = false
  editingTransactionId.value = null
  accountStore.clearCurrentTransaction()
}

function setActiveTab(tab: AccountingTab): void {
  activeTab.value = tab

  if (tab !== 'accounts') {
    showAccountModal.value = false
    editingAccountId.value = null
  }

  if (tab !== 'transactions') {
    showTransactionModal.value = false
    editingTransactionId.value = null
  }
}

function openCreateAccountModal(fromTransaction = false, context: AccountCreationContext | null = null): void {
  if (!fromTransaction) {
    setActiveTab('accounts')
  }
  accountCreationContext.value = context
  editingAccountId.value = null
  accountForm.value = createAccountFormFromContext(context)
  accountFormSuccessMessage.value = ''
  accountFormValidationMessage.value = ''
  accountStore.clearError()
  showAccountModal.value = true
}

async function openAccountDetailById(id: number): Promise<void> {
  setActiveTab('accounts')
  editingAccountId.value = id
  accountStore.clearError()

  const detail = await accountStore.getAccountById(id)
  if (!detail) return

  accountForm.value = createAccountFormFromDetail(detail)
  accountFormSuccessMessage.value = ''
  accountFormValidationMessage.value = ''

  showAccountModal.value = true
}

async function openEditAccountModal(account: ChartOfAccountList): Promise<void> {
  await openAccountDetailById(account.id)
}

function validateAccountForm(): boolean {
  accountFormValidationMessage.value = ''

  if (!accountForm.value.name.trim()) {
    accountFormValidationMessage.value = 'Account name is required.'
    return false
  }

  if (!canManageOpeningBalanceInForm.value || !accountForm.value.create_opening_balance_now) {
    return true
  }

  const openingAmount = normalizeAmount(accountForm.value.opening_balance)

  if (openingAmount <= 0) {
    accountFormValidationMessage.value = 'Please enter an opening balance above zero or leave journal entry creation turned off.'
    return false
  }

  if (!accountForm.value.opening_date) {
    accountFormValidationMessage.value = 'Please choose the opening balance date.'
    return false
  }

  if (isFutureBusinessDate(accountForm.value.opening_date)) {
    accountFormValidationMessage.value = `Opening balance date cannot be after ${BUSINESS_DATE}.`
    return false
  }

  return true
}

async function handleSaveAccount(): Promise<void> {
  if (!validateAccountForm()) return

  const openingBalanceEnabled = canManageOpeningBalanceInForm.value && accountForm.value.create_opening_balance_now
  const createPayload = {
    name: accountForm.value.name.trim(),
    account_type: accountForm.value.account_type,
    parent: accountForm.value.parent ? Number(accountForm.value.parent) : null,
    description: accountForm.value.description.trim() || null,
    is_active: accountForm.value.is_active === 'true',
    ...(openingBalanceEnabled
      ? {
          opening_balance: normalizeAmount(accountForm.value.opening_balance).toFixed(2),
          opening_date: accountForm.value.opening_date,
          ...(accountForm.value.opening_contra_account_id
            ? { opening_contra_account_id: Number(accountForm.value.opening_contra_account_id) }
            : {})
        }
      : {})
  }
  const updatePayload = {
    name: createPayload.name,
    account_type: createPayload.account_type,
    parent: createPayload.parent,
    description: createPayload.description,
    is_active: createPayload.is_active
  }

  if (!createPayload.name) return

  const isEditingAccount = !!editingAccountId.value
  const currentAccountPage = accountStore.pagination.page
  const result = isEditingAccount && editingAccountId.value
    ? await accountStore.updateAccount(editingAccountId.value, updatePayload)
    : await accountStore.createAccount(createPayload)

  if (!result) return

  accountFormSuccessMessage.value = isEditingAccount
    ? 'Account updated successfully.'
    : openingBalanceEnabled
      ? result.opening_transaction?.transaction_no
        ? `Account and opening balance saved successfully. Journal entry ${result.opening_transaction.transaction_no} was created.`
        : 'Account and opening balance saved successfully.'
      : 'Account created successfully.'

  closeAccountModal()
  await refreshAccounts({ page: isEditingAccount ? currentAccountPage : 1 })
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
  setActiveTab('transactions')
  editingTransactionId.value = null
  accountStore.clearCurrentTransaction()
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

function openCreateAccountFromTransaction(accountType: AccountType | null = null): void {
  openCreateAccountModal(true, { accountType })
}

async function openTransactionDetailById(id: number): Promise<void> {
  setActiveTab('transactions')
  editingTransactionId.value = id
  accountStore.clearError()

  const detail = await accountStore.getTransactionById(id)
  if (!detail) return

  populateTransactionForm()
  showTransactionModal.value = true
}

async function openEditTransactionModal(transaction: AccountingTransactionList): Promise<void> {
  await openTransactionDetailById(transaction.id)
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

async function resetTransactionFilters(): Promise<void> {
  suppressTransactionFilterWatch.value = true
  if (transactionSearchDebounceTimer) {
    clearTimeout(transactionSearchDebounceTimer)
    transactionSearchDebounceTimer = null
  }
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
  suppressTransactionFilterWatch.value = false
}

async function showTransactionsForAccount(accountId: number): Promise<void> {
  suppressTransactionFilterWatch.value = true
  transactionFilters.value = {
    search: '',
    status: '',
    account: String(accountId),
    transaction_date_min: '',
    transaction_date_max: ''
  }
  accountStore.setTransactionPage(1)
  setActiveTab('transactions')
  closeAccountModal()
  await refreshTransactions({
    page: 1,
    search: undefined,
    status: undefined,
    account: accountId,
    transaction_date_min: undefined,
    transaction_date_max: undefined
  })
  suppressTransactionFilterWatch.value = false
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

async function applyRouteState(): Promise<void> {
  const tab = normalizeAccountingTab(route.query.tab)
  const accountId = parseQueryId(route.query.account)
  const transactionId = parseQueryId(route.query.transaction)

  suppressRouteSync.value = true

  if (transactionId) {
    await openTransactionDetailById(transactionId)
  } else if (accountId) {
    await openAccountDetailById(accountId)
  } else {
    setActiveTab(tab)
    closeAccountModal()
    closeTransactionModal()
  }

  if (!transactionId && !accountId) {
    activeTab.value = tab
  }

  suppressRouteSync.value = false
}

onMounted(async () => {
  await loadPage()
  await applyRouteState()
  await syncRouteState()
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

watch(
  () => accountForm.value.account_type,
  value => {
    if (accountForm.value.parent) {
      const parentStillValid = parentOptions.value.some(option => option.value === accountForm.value.parent)
      if (!parentStillValid) {
        accountForm.value.parent = ''
      }
    }

    if (OPENING_BALANCE_PROMPT_TYPES.includes(value)) {
      if (!accountForm.value.opening_contra_account_id) {
        accountForm.value.opening_contra_account_id = findDefaultOpeningContraAccountId()
      }
      return
    }

    accountForm.value.create_opening_balance_now = false
    accountForm.value.opening_balance = ''
    accountForm.value.opening_date = BUSINESS_DATE
    accountForm.value.opening_contra_account_id = ''
  }
)

watch(
  () => openingContraAccounts.value.map(account => account.id).join(','),
  () => {
    if (!supportsOpeningBalance.value || accountForm.value.opening_contra_account_id) return
    accountForm.value.opening_contra_account_id = findDefaultOpeningContraAccountId()
  }
)

watch(
  () => transactionFilters.value.search,
  value => {
    if (suppressTransactionFilterWatch.value) return
    if (transactionSearchDebounceTimer) clearTimeout(transactionSearchDebounceTimer)

    transactionSearchDebounceTimer = setTimeout(() => {
      accountStore.setTransactionPage(1)
      void refreshTransactions({ page: 1, search: value || undefined })
    }, 250)
  }
)

watch(
  () => [
    transactionFilters.value.account,
    transactionFilters.value.status,
    transactionFilters.value.transaction_date_min,
    transactionFilters.value.transaction_date_max
  ],
  () => {
    if (suppressTransactionFilterWatch.value) return
    accountStore.setTransactionPage(1)
    void refreshTransactions({ page: 1 })
  }
)

watch(
  () => [activeTab.value, showAccountModal.value, editingAccountId.value, showTransactionModal.value, editingTransactionId.value],
  () => {
    void syncRouteState()
  }
)

watch(
  () => [route.query.tab, route.query.account, route.query.transaction],
  async () => {
    if (suppressRouteSync.value) return
    await applyRouteState()
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

function isAccountTypeFilterSelected(value: '' | AccountType): boolean {
  if (!value) {
    return accountFilters.value.account_type.length === 0
  }

  return accountFilters.value.account_type.includes(value)
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
          @click="() => openCreateAccountModal()"
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

    <div
      v-if="accountFormSuccessMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
    >
      {{ accountFormSuccessMessage }}
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
            @click="setActiveTab('accounts')"
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
            @click="setActiveTab('transactions')"
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
            @click="setActiveTab('roadmap')"
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
                  isAccountTypeFilterSelected(option.value)
                    ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                    : 'border-transparent bg-white text-gray-600 hover:border-gray-200 hover:text-gray-900'
                ]"
                @click="toggleAccountTypeFilter(option.value)"
              >
                <span
                  :class="[
                    'inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold',
                    isAccountTypeFilterSelected(option.value)
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
        <div
          v-if="transactionFilters.account"
          class="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm font-semibold text-sky-900">
              Showing transaction history for
              <span class="font-bold">{{ selectedTransactionAccountName || `account #${transactionFilters.account}` }}</span>
            </p>
            <p class="mt-1 text-sm text-sky-800">
              This list is paginated and filtered using the selected account ID.
            </p>
          </div>
          <button
            class="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-sky-700 border border-sky-200 transition-colors hover:bg-sky-100"
            @click="resetTransactionFilters"
          >
            Clear Account Filter
          </button>
        </div>

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
              <div class="text-sm text-gray-800">{{ getTransactionPrimaryLine(row, 'debit') }}</div>
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
              <div class="text-sm text-gray-800">{{ getTransactionPrimaryLine(row, 'credit') }}</div>
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
      :z-index-class="showTransactionModal ? 'z-[60]' : 'z-50'"
      @close="closeAccountModal"
      @submit="handleSaveAccount"
    >
      <div class="space-y-4">
        <div
          v-if="accountFormValidationMessage"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ accountFormValidationMessage }}
        </div>

        <FormInput
          v-model="accountForm.name"
          label="Account Name"
          placeholder="e.g. Cash in Bank"
        />

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

        <div
          v-if="accountNeedsOpeningBalanceBanner"
          class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
        >
          <div class="flex flex-col gap-2">
            <p class="font-semibold">This account has no starting balance yet.</p>
            <p class="text-amber-800">This may affect your balance sheet accuracy.</p>
            <div>
              <p class="text-amber-800">
                The current API payload only supports opening balance during account creation, so this screen can show the warning but cannot post a new opening journal entry yet.
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="existingOpeningBalanceSummary"
          class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
        >
          <p class="font-semibold">
            Opening balance: ৳{{ formatCurrency(existingOpeningBalanceSummary.amount) }}
            <span class="font-normal">as of {{ formatDisplayDate(existingOpeningBalanceSummary.date) }}</span>
          </p>
          <p v-if="existingOpeningBalanceSummary.contraAccountName" class="mt-1 text-emerald-800">
            Contra account: {{ existingOpeningBalanceSummary.contraAccountName }}
          </p>
          <p
            v-if="existingOpeningBalanceSummary.transactionNo || existingOpeningBalanceSummary.transactionId"
            class="mt-1 text-emerald-800"
          >
            Journal entry:
            {{ existingOpeningBalanceSummary.transactionNo || `#${existingOpeningBalanceSummary.transactionId}` }}
          </p>
          <p class="mt-2 text-emerald-800">
            Opening balances are read-only here once created. Use a separate adjustment entry if you need to correct it.
          </p>
        </div>

        <section
          v-if="supportsOpeningBalance"
          :class="[
            'rounded-2xl border px-4 py-4 sm:px-5',
            shouldHighlightOpeningBalance
              ? 'border-primary-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50'
              : 'border-slate-200 bg-slate-50'
          ]"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 class="text-base font-semibold text-slate-900">Opening Balance</h4>
              <p class="mt-1 text-sm text-slate-600">
                Setting an opening balance creates a journal entry so your reports start correctly.
              </p>
            </div>
            <label
              v-if="canManageOpeningBalanceInForm && !existingOpeningBalanceSummary"
              class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              <input
                v-model="accountForm.create_opening_balance_now"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              >
              Create journal entry now
            </label>
          </div>

          <div v-if="!existingOpeningBalanceSummary" class="mt-4 space-y-4">
            <div v-if="!openingContraAccounts.length" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No active equity account is available for the opening balance contra side yet. Create one first, then return to this account.
            </div>

            <div
              v-if="canManageOpeningBalanceInForm && accountForm.create_opening_balance_now"
              class="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Opening Balance Amount</label>
                <div class="flex h-[42px] items-center overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500">
                  <span class="border-r border-gray-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">৳</span>
                  <input
                    v-model="accountForm.opening_balance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-full border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0"
                  >
                </div>
              </div>

              <FormInput
                v-model="accountForm.opening_date"
                label="Opening Balance Date"
                type="date"
                :max="BUSINESS_DATE"
              />

              <FormSelect
                v-model="accountForm.opening_contra_account_id"
                label="Contra Account"
                :options="openingContraAccountOptions"
              />
            </div>

            <div class="rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700">
              {{
                canManageOpeningBalanceInForm
                  ? openingBalancePreviewText
                  : 'Opening balance details can be supplied when the account is first created. Existing accounts currently show status only.'
              }}
            </div>

            <p
              v-if="canManageOpeningBalanceInForm && accountForm.create_opening_balance_now"
              class="text-xs text-slate-500"
            >
              Contra account is optional. Leave it blank to let the system use the default contra account automatically.
            </p>
          </div>
        </section>
      </div>

      <template #actions>
        <div class="flex w-full flex-wrap justify-between gap-3">
          <div>
            <div class="flex flex-wrap gap-3">
              <button
                v-if="editingAccountId"
                type="button"
                class="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 transition-colors"
                @click="editingAccountId && showTransactionsForAccount(editingAccountId)"
              >
                View Transactions
              </button>
              <button
                v-if="editingAccountId"
                type="button"
                class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                @click="editingAccount && promptDeleteAccount(editingAccount)"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              @click="closeAccountModal"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {{ accountSubmitLabel }}
            </button>
          </div>
        </div>
      </template>
    </FormModal>

    <FormModal
      :show="showTransactionModal"
      :title="editingTransactionId ? 'Edit Transaction' : 'Add Transaction'"
      size="xl"
      @close="closeTransactionModal"
      @submit="handleSaveTransaction"
    >
      <div class="space-y-5">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormSelect
            :model-value="transactionForm.transaction_type"
            label="Transaction Type"
            :options="transactionTypeOptions"
            :disabled="!editableTransaction"
            @update:model-value="handleTransactionTypeChange"
          />
          <FormInput
            v-model="transactionForm.transaction_date"
            label="Transaction Date"
            type="date"
            :disabled="!editableTransaction"
          />
          <FormInput
            v-model="transactionForm.reference"
            label="Reference"
            placeholder="Invoice / voucher ref"
            :disabled="!editableTransaction"
          />
          <FormInput
            v-model="transactionForm.description"
            label="Description"
            placeholder="Narration"
            :disabled="!editableTransaction"
          />
        </div>

        <div
          v-if="selectedTransactionPreset"
          class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <div>
            <p class="text-sm font-medium text-gray-900">{{ selectedTransactionPreset.description }}</p>
            <p class="mt-1 text-xs text-gray-500">
              Choose the business accounts below. The system will prepare the matching debit and credit entry automatically.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <FormSelect
                  v-model="transactionForm.lines[0].account_id"
                  :label="selectedTransactionPreset.debitLabel"
                  :options="debitAccountOptions"
                  placeholder="Select account"
                  :disabled="!editableTransaction"
                />
              </div>
              <button
                v-if="editableTransaction"
                type="button"
                class="mb-0.5 inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 transition-colors hover:bg-primary-50"
                title="Create account"
                aria-label="Create account"
                @click="openCreateAccountFromTransaction(selectedTransactionPreset.debitAccountTypes[0] || null)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <FormSelect
                  v-model="transactionForm.lines[1].account_id"
                  :label="selectedTransactionPreset.creditLabel"
                  :options="creditAccountOptions"
                  placeholder="Select account"
                  :disabled="!editableTransaction"
                />
              </div>
              <button
                v-if="editableTransaction"
                type="button"
                class="mb-0.5 inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 transition-colors hover:bg-primary-50"
                title="Create account"
                aria-label="Create account"
                @click="openCreateAccountFromTransaction(selectedTransactionPreset.creditAccountTypes[0] || null)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormInput
              v-model="presetAmount"
              :label="selectedTransactionPreset.amountLabel"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :disabled="!editableTransaction"
            />
            <FormInput
              v-model="transactionForm.lines[0].description"
              :label="selectedTransactionPreset.debitNoteLabel"
              placeholder="Optional line note"
              :disabled="!editableTransaction"
            />
            <FormInput
              v-model="transactionForm.lines[1].description"
              :label="selectedTransactionPreset.creditNoteLabel"
              placeholder="Optional line note"
              :disabled="!editableTransaction"
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
              <div class="flex items-center gap-2">
                <select
                  v-model="line.account_id"
                  :disabled="!editableTransaction"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  :class="!editableTransaction ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'"
                >
                  <option value="" disabled>Select an account</option>
                  <option v-for="option in accountSelectOptions.slice(1)" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <button
                  v-if="editableTransaction"
                  type="button"
                  class="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 transition-colors hover:bg-primary-50"
                  title="Create account"
                  aria-label="Create account"
                  @click="openCreateAccountFromTransaction(null)"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <input
                v-model="line.description"
                type="text"
                :disabled="!editableTransaction"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                :class="!editableTransaction ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'"
                placeholder="Line description"
              />

              <input
                v-model="line.debit_amount"
                type="number"
                step="0.01"
                min="0"
                :disabled="!editableTransaction"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                :class="!editableTransaction ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'"
                placeholder="0.00"
              />

              <input
                v-model="line.credit_amount"
                type="number"
                step="0.01"
                min="0"
                :disabled="!editableTransaction"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                :class="!editableTransaction ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'"
                placeholder="0.00"
              />

              <button
                v-if="editableTransaction"
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
            v-if="!selectedTransactionPreset && editableTransaction"
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
              v-if="editingTransactionId && editableTransaction"
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
              v-if="editableTransaction"
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
