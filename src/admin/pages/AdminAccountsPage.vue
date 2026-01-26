<script setup>
import { ref, computed } from 'vue'
import StatCard from '@/components/admin/StatCard.vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { useAccountStore } from '@/stores/admin/accountStore'

const accountStore = useAccountStore()

const showAddAccountModal = ref(false)
const showAddTransactionModal = ref(false)
const activeTab = ref('accounts')

const newAccount = ref({
  name: '',
  type: 'income',
  code: '',
  description: ''
})

const newTransaction = ref({
  accountId: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  amount: 0,
  type: 'income',
  category: '',
  reference: ''
})

const accountColumns = [
  { key: 'code', label: 'Code', width: '100px' },
  { key: 'name', label: 'Account Name' },
  { key: 'type', label: 'Type', width: '120px' },
  { key: 'balance', label: 'Balance', width: '150px' }
]

const transactionColumns = [
  { key: 'date', label: 'Date', width: '120px' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category', width: '120px' },
  { key: 'type', label: 'Type', width: '100px' },
  { key: 'amount', label: 'Amount', width: '120px' },
  { key: 'reference', label: 'Reference', width: '140px' }
]

const accountTypeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'investment', label: 'Investment' }
]

const transactionTypeOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' }
]

const accountOptions = computed(() => {
  return accountStore.accounts.map(a => ({
    value: a.id,
    label: `${a.code} - ${a.name}`
  }))
})

const categoryOptions = [
  { value: 'Sales', label: 'Sales' },
  { value: 'Services', label: 'Services' },
  { value: 'Interest', label: 'Interest' },
  { value: 'Supplies', label: 'Supplies' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Rent', label: 'Rent' },
  { value: 'Salaries', label: 'Salaries' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Other', label: 'Other' }
]

const stats = computed(() => [
  {
    title: 'Total Income',
    value: `$${accountStore.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'green'
  },
  {
    title: 'Total Expenses',
    value: `$${accountStore.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: '17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    color: 'red'
  },
  {
    title: 'Net Balance',
    value: `$${accountStore.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'blue'
  }
])

const openAddAccountModal = () => {
  newAccount.value = { name: '', type: 'income', code: '', description: '' }
  showAddAccountModal.value = true
}

const openAddTransactionModal = () => {
  newTransaction.value = {
    accountId: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'income',
    category: '',
    reference: ''
  }
  showAddTransactionModal.value = true
}

const handleAddAccount = () => {
  if (!newAccount.value.name || !newAccount.value.type) return
  accountStore.addAccount(newAccount.value)
  showAddAccountModal.value = false
}

const handleAddTransaction = () => {
  if (!newTransaction.value.accountId || !newTransaction.value.description || newTransaction.value.amount <= 0) return
  if (!newTransaction.value.category) {
    newTransaction.value.category = 'Other'
  }
  accountStore.addTransaction(newTransaction.value)
  showAddTransactionModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Chart of Accounts & Finance</h1>
        <p class="text-gray-500 mt-1">Manage your accounts and track financial transactions</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="openAddAccountModal"
          class="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
        <button
          @click="openAddTransactionModal"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        v-for="stat in stats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :icon="stat.icon"
        :color="stat.color"
      />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'accounts'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'accounts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Chart of Accounts
          </button>
          <button
            @click="activeTab = 'transactions'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'transactions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Transactions
          </button>
        </nav>
      </div>
      
      <div class="p-6">
        <div v-if="activeTab === 'accounts'">
          <DataTable
            :columns="accountColumns"
            :data="accountStore.accounts"
          >
            <template #code="{ value }">
              <span class="font-mono text-sm text-gray-600">{{ value }}</span>
            </template>
            <template #type="{ value }">
              <StatusBadge :status="value" />
            </template>
            <template #balance="{ value }">
              <span :class="value >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                {{ value >= 0 ? '' : '-' }}${{ Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </template>
          </DataTable>
        </div>
        
        <div v-if="activeTab === 'transactions'">
          <DataTable
            :columns="transactionColumns"
            :data="accountStore.transactions"
          >
            <template #date="{ value }">
              {{ new Date(value).toLocaleDateString() }}
            </template>
            <template #type="{ value }">
              <StatusBadge :status="value" size="sm" />
            </template>
            <template #amount="{ value }">
              <span :class="value >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                {{ value >= 0 ? '+' : '' }}${{ Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </template>
            <template #reference="{ value }">
              <span class="font-mono text-xs text-gray-500">{{ value }}</span>
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <FormModal
      :show="showAddAccountModal"
      title="Add New Account"
      @close="showAddAccountModal = false"
      @submit="handleAddAccount"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newAccount.name"
          label="Account Name"
          placeholder="e.g., Sales Revenue, Office Supplies"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <FormSelect
            v-model="newAccount.type"
            label="Account Type"
            :options="accountTypeOptions"
          />
          <FormInput
            v-model="newAccount.code"
            label="Account Code"
            placeholder="e.g., INC-001"
          />
        </div>
        <FormInput
          v-model="newAccount.description"
          label="Description"
          placeholder="Brief description of this account"
        />
      </div>
    </FormModal>

    <FormModal
      :show="showAddTransactionModal"
      title="Add New Transaction"
      @close="showAddTransactionModal = false"
      @submit="handleAddTransaction"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormSelect
            v-model="newTransaction.accountId"
            label="Account"
            :options="accountOptions"
            placeholder="Select account"
          />
          <FormInput
            v-model="newTransaction.date"
            label="Date"
            type="date"
          />
        </div>
        <FormInput
          v-model="newTransaction.description"
          label="Description"
          placeholder="What is this transaction for?"
          required
        />
        <div class="grid grid-cols-3 gap-4">
          <FormInput
            v-model.number="newTransaction.amount"
            label="Amount ($)"
            type="number"
            step="0.01"
            min="0"
            required
          />
          <FormSelect
            v-model="newTransaction.type"
            label="Type"
            :options="transactionTypeOptions"
          />
          <FormSelect
            v-model="newTransaction.category"
            label="Category"
            :options="categoryOptions"
            placeholder="Select"
          />
        </div>
        <FormInput
          v-model="newTransaction.reference"
          label="Reference Number"
          placeholder="Invoice/receipt number (optional)"
        />
      </div>
    </FormModal>
  </div>
</template>
