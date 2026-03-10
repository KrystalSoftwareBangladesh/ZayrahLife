<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import StatCard from '@/components/admin/StatCard.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useAccountStore } from '@/stores/admin/accountStore'
import type { AccountType, ChartOfAccountList, ChartOfAccountListParams } from '@/api/types'

type AccountFormState = {
  code: string
  name: string
  account_type: AccountType
  parent: string
  description: string
  is_active: 'true' | 'false'
}

const accountStore = useAccountStore()

const activeTab = ref<'accounts' | 'roadmap'>('accounts')
const showAccountModal = ref(false)
const showDeleteModal = ref(false)
const editingAccountId = ref<number | null>(null)
const accountPendingDelete = ref<ChartOfAccountList | null>(null)

const filters = ref<{
  search: string
  account_type: '' | AccountType
  status: '' | 'true' | 'false'
}>({
  search: '',
  account_type: '',
  status: ''
})

const accountForm = ref<AccountFormState>(createEmptyForm())

const accountColumns = [
  { key: 'code', label: 'Code', width: '120px' },
  { key: 'name', label: 'Account Name' },
  { key: 'account_type', label: 'Type', width: '140px' },
  { key: 'parent', label: 'Parent', width: '180px' },
  { key: 'is_active', label: 'Status', width: '120px' }
]

const accountTypeOptions = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' }
]

const filterTypeOptions = [
  { value: '', label: 'All types' },
  ...accountTypeOptions
]

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
]

const statusOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' }
]

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

const stats = computed(() => [
  {
    title: 'Total Accounts',
    value: accountStore.totalAccounts,
    icon: 'file',
    color: 'primary'
  },
  {
    title: 'Active Accounts',
    value: accountStore.activeAccounts,
    icon: 'check',
    color: 'green'
  },
  {
    title: 'Root Accounts',
    value: accountStore.rootAccounts,
    icon: 'users',
    color: 'blue'
  }
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

const roadmap = [
  {
    title: 'Phase 1: Core Setup',
    description: 'Chart of accounts, fiscal periods, opening balances, and role-based accounting permissions.',
    status: 'In progress'
  },
  {
    title: 'Phase 2: Daily Bookkeeping',
    description: 'Journal entries, recurring vouchers, ledger posting, and source-document attachments.',
    status: 'Next'
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

function createEmptyForm(): AccountFormState {
  return {
    code: '',
    name: '',
    account_type: 'ASSET',
    parent: '',
    description: '',
    is_active: 'true'
  }
}

function normalizeParentId(parentName: string): number | null {
  if (!parentName) return null
  return accountStore.accountOptions.find(account => account.name === parentName)?.id || null
}

async function refreshAccounts(params: ChartOfAccountListParams = {}): Promise<void> {
  const resolvedSearch = (params.search ?? filters.value.search) || undefined
  const resolvedAccountType = (params.account_type ?? filters.value.account_type) || undefined
  const resolvedIsActive =
    params.is_active !== undefined
      ? params.is_active
      : filters.value.status === ''
        ? undefined
        : filters.value.status === 'true'

  await accountStore.fetchAccounts({
    page: params.page || accountStore.pagination.page,
    search: resolvedSearch,
    account_type: resolvedAccountType,
    is_active: resolvedIsActive,
    ordering: params.ordering || 'code'
  })
}

async function loadPage(): Promise<void> {
  await Promise.all([refreshAccounts({ page: 1 }), accountStore.fetchAccountOptions()])
}

function openCreateModal(): void {
  editingAccountId.value = null
  accountForm.value = createEmptyForm()
  accountStore.clearError()
  showAccountModal.value = true
}

async function openEditModal(account: ChartOfAccountList): Promise<void> {
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

function promptDelete(account: ChartOfAccountList): void {
  showAccountModal.value = false
  accountPendingDelete.value = account
  showDeleteModal.value = true
}

async function handleDeleteAccount(): Promise<void> {
  if (!accountPendingDelete.value) return

  const success = await accountStore.deleteAccount(accountPendingDelete.value.id)
  if (!success) return

  showDeleteModal.value = false
  accountPendingDelete.value = null
}

async function applyFilters(): Promise<void> {
  accountStore.setPage(1)
  await refreshAccounts({ page: 1 })
}

async function resetFilters(): Promise<void> {
  filters.value = {
    search: '',
    account_type: '',
    status: ''
  }
  accountStore.setPage(1)
  await refreshAccounts({ page: 1, search: undefined, account_type: undefined, is_active: undefined })
}

async function goToPage(page: number): Promise<void> {
  if (page < 1) return
  accountStore.setPage(page)
  await refreshAccounts({ page })
}

onMounted(() => {
  loadPage()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p class="mt-1 text-gray-500">
          API-backed account master data for the accounting module. Journal and ledger APIs are not in the backend spec yet.
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
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          @click="openCreateModal"
        >
          Add Account
        </button>
      </div>
    </div>

    <div v-if="accountStore.error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ accountStore.error }}
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[2fr,1fr]">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Account Structure</h2>
            <p class="mt-1 text-sm text-gray-500">Current page breakdown by major account class.</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
        <p class="mt-1 text-sm text-gray-500">
          Implementation sequence based on the current backend coverage in the attached OpenAPI spec.
        </p>
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
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[2fr,1fr,1fr,auto]">
          <FormInput
            v-model="filters.search"
            label="Search"
            placeholder="Search by code or account name"
          />
          <FormSelect
            v-model="filters.account_type"
            label="Account Type"
            :options="filterTypeOptions"
          />
          <FormSelect
            v-model="filters.status"
            label="Status"
            :options="statusFilterOptions"
          />
          <div class="flex items-end gap-2">
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              @click="applyFilters"
            >
              Apply
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              @click="resetFilters"
            >
              Reset
            </button>
          </div>
        </div>

        <DataTable
          :columns="accountColumns"
          :data="accountStore.accounts"
          :loading="accountStore.loading"
          @row-click="openEditModal"
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
              @click="goToPage(accountStore.pagination.page - 1)"
            >
              Previous
            </button>
            <button
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!accountStore.pagination.hasNext || accountStore.loading"
              @click="goToPage(accountStore.pagination.page + 1)"
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
            :options="statusOptions"
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
            @click="editingAccount && promptDelete(editingAccount)"
          >
            Delete Account
          </button>
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Account"
      :message="`Delete ${accountPendingDelete?.code || ''} ${accountPendingDelete?.name || ''}? This cannot be undone.`"
      confirm-text="Delete"
      @cancel="showDeleteModal = false"
      @confirm="handleDeleteAccount"
    />
  </div>
</template>
