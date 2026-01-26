<script setup>
import { computed } from 'vue'
import StatCard from '@/components/admin/StatCard.vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useAccountStore } from '@/stores/admin/accountStore'

const accountStore = useAccountStore()

const accountColumns = [
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Accounts & Finance</h1>
      <p class="text-gray-500 mt-1">Track your financial transactions and accounts</p>
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

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Accounts</h2>
      <DataTable
        :columns="accountColumns"
        :data="accountStore.accounts"
      >
        <template #type="{ value }">
          <StatusBadge :status="value" />
        </template>
        <template #balance="{ value }">
          <span :class="value >= 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
            ${{ Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </span>
        </template>
      </DataTable>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
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
</template>
