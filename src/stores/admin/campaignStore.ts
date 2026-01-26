import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockCampaigns } from '@/mock/admin/campaigns'

export const useCampaignStore = defineStore('adminCampaigns', () => {
  const campaigns = ref([...mockCampaigns])
  const loading = ref(false)

  const totalBudget = computed(() => campaigns.value.reduce((sum, c) => sum + c.budget, 0))
  const totalSpend = computed(() => campaigns.value.reduce((sum, c) => sum + c.spend, 0))
  const totalRevenue = computed(() => campaigns.value.reduce((sum, c) => sum + c.revenue, 0))
  const totalOrders = computed(() => campaigns.value.reduce((sum, c) => sum + c.orders, 0))

  const overallROAS = computed(() => {
    if (totalSpend.value === 0) return 0
    return (totalRevenue.value / totalSpend.value).toFixed(2)
  })

  const activeCampaigns = computed(() => campaigns.value.filter(c => c.status === 'running'))

  function getCampaignById(id: string | number) {
    return campaigns.value.find(c => c.id === parseInt(String(id)))
  }

  function updateCampaignStatus(id: string | number, status: string) {
    const campaign = campaigns.value.find(c => c.id === parseInt(String(id)))
    if (campaign) {
      campaign.status = status
    }
  }

  return {
    campaigns,
    loading,
    totalBudget,
    totalSpend,
    totalRevenue,
    totalOrders,
    overallROAS,
    activeCampaigns,
    getCampaignById,
    updateCampaignStatus
  }
})
