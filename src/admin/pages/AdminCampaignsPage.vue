<script setup>
import { computed } from 'vue'
import StatCard from '@/components/admin/StatCard.vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useCampaignStore } from '@/stores/admin/campaignStore'

const campaignStore = useCampaignStore()

const columns = [
  { key: 'name', label: 'Campaign' },
  { key: 'platform', label: 'Platform', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'budget', label: 'Budget', width: '100px' },
  { key: 'spend', label: 'Spend', width: '100px' },
  { key: 'orders', label: 'Orders', width: '80px' },
  { key: 'revenue', label: 'Revenue', width: '120px' },
  { key: 'roas', label: 'ROAS', width: '80px' }
]

const stats = computed(() => [
  {
    title: 'Total Budget',
    value: `$${campaignStore.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'blue'
  },
  {
    title: 'Total Spend',
    value: `$${campaignStore.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    color: 'yellow'
  },
  {
    title: 'Campaign Revenue',
    value: `$${campaignStore.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'green'
  },
  {
    title: 'Overall ROAS',
    value: `${campaignStore.overallROAS}x`,
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    color: 'purple'
  }
])

const getPlatformClass = (platform) => {
  const classes = {
    'Facebook': 'bg-blue-100 text-blue-700',
    'Instagram': 'bg-pink-100 text-pink-700',
    'Google Ads': 'bg-red-100 text-red-700',
    'Email': 'bg-gray-100 text-gray-700'
  }
  return classes[platform] || 'bg-gray-100 text-gray-700'
}

const getRoasClass = (roas) => {
  if (roas >= 3) return 'text-green-600 font-bold'
  if (roas >= 2) return 'text-yellow-600 font-medium'
  return 'text-red-600'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Campaigns</h1>
      <p class="text-gray-500 mt-1">Track marketing campaign performance and ROI</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">All Campaigns</h2>
        <div class="text-sm text-gray-500">
          {{ campaignStore.activeCampaigns.length }} active campaigns
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="campaignStore.campaigns"
      >
        <template #name="{ row }">
          <div>
            <p class="font-medium text-gray-900">{{ row.name }}</p>
            <p class="text-xs text-gray-500">{{ row.startDate }} - {{ row.endDate }}</p>
          </div>
        </template>
        <template #platform="{ value }">
          <span :class="getPlatformClass(value)" class="px-2 py-1 text-xs font-medium rounded">
            {{ value }}
          </span>
        </template>
        <template #status="{ value }">
          <StatusBadge :status="value" size="sm" />
        </template>
        <template #budget="{ value }">
          ${{ value.toLocaleString() }}
        </template>
        <template #spend="{ row }">
          <div>
            <span class="font-medium">${{ row.spend.toLocaleString() }}</span>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                class="bg-primary-600 h-1.5 rounded-full"
                :style="{ width: `${(row.spend / row.budget) * 100}%` }"
              ></div>
            </div>
          </div>
        </template>
        <template #revenue="{ value }">
          <span class="font-medium text-green-600">${{ value.toLocaleString() }}</span>
        </template>
        <template #roas="{ value }">
          <span :class="getRoasClass(value)">{{ value }}x</span>
        </template>
      </DataTable>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Total Impressions</span>
            <span class="font-semibold">
              {{ campaignStore.campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Total Clicks</span>
            <span class="font-semibold">
              {{ campaignStore.campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Total Conversions</span>
            <span class="font-semibold">
              {{ campaignStore.campaigns.reduce((sum, c) => sum + c.conversions, 0).toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Average CTR</span>
            <span class="font-semibold">
              {{ (campaignStore.campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaignStore.campaigns.length).toFixed(2) }}%
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Average CPC</span>
            <span class="font-semibold">
              ${{ (campaignStore.campaigns.reduce((sum, c) => sum + c.cpc, 0) / campaignStore.campaigns.length).toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">ROI Analysis</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Total Investment</span>
              <span class="font-medium text-red-600">
                -${{ campaignStore.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Total Returns</span>
              <span class="font-medium text-green-600">
                +${{ campaignStore.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
          <div class="pt-4 border-t">
            <div class="flex justify-between">
              <span class="font-medium text-gray-900">Net Profit from Campaigns</span>
              <span class="font-bold text-lg text-green-600">
                ${{ (campaignStore.totalRevenue - campaignStore.totalSpend).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
          <div class="pt-4 border-t">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">Overall ROI</span>
              <span class="font-bold text-2xl" :class="(campaignStore.totalRevenue - campaignStore.totalSpend) / campaignStore.totalSpend * 100 >= 100 ? 'text-green-600' : 'text-yellow-600'">
                {{ (((campaignStore.totalRevenue - campaignStore.totalSpend) / campaignStore.totalSpend) * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
