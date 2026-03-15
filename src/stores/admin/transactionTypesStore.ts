import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionsApi } from '@/api/transactions'
import type { TransactionTypeOption, AccountType } from '@/api/types'

interface TransactionTypePreset {
  debit_account_types: AccountType[]
  credit_account_types: AccountType[]
  description: string
}

const FALLBACK_TRANSACTION_TYPES: TransactionTypeOption[] = [
  {
    value: 'JOURNAL',
    label: 'Journal'
  },
  {
    value: 'PAYMENT',
    label: 'Payment'
  },
  {
    value: 'RECEIPT',
    label: 'Receipt'
  },
  {
    value: 'PURCHASE',
    label: 'Purchase'
  },
  {
    value: 'SALE',
    label: 'Sale'
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustment'
  },
  {
    value: 'OPENING_BALANCE',
    label: 'Opening Balance'
  },
  {
    value: 'TRANSFER',
    label: 'Transfer'
  }
]

const PRESET_CONFIG_BY_TYPE: Record<string, TransactionTypePreset> = {
  PAYMENT: {
    debit_account_types: ['EXPENSE', 'LIABILITY'],
    credit_account_types: ['ASSET'],
    description: 'Record an outgoing payment by debiting an expense or liability and crediting cash or bank.'
  },
  RECEIPT: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['REVENUE', 'LIABILITY', 'EQUITY'],
    description: 'Record incoming money by debiting cash or bank and crediting revenue or another source account.'
  },
  PURCHASE: {
    debit_account_types: ['EXPENSE', 'ASSET'],
    credit_account_types: ['LIABILITY', 'ASSET'],
    description: 'Record a purchase by debiting an expense or asset and crediting payable or cash/bank.'
  },
  SALE: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['REVENUE', 'LIABILITY'],
    description: 'Record a sale by debiting cash/receivable and crediting revenue or tax-related liability.'
  },
  OPENING_BALANCE: {
    debit_account_types: ['ASSET', 'EXPENSE'],
    credit_account_types: ['LIABILITY', 'EQUITY', 'REVENUE'],
    description: 'Capture opening balances when setting up the books or starting a new period.'
  },
  TRANSFER: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['ASSET'],
    description: 'Move value between cash, bank, or other asset accounts.'
  }
}

export const useTransactionTypesStore = defineStore('transactionTypes', () => {
  const types = ref<TransactionTypeOption[]>([])
  const defaultType = ref<string>('JOURNAL')
  const isLoaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const typeOptions = computed(() => {
    return types.value.map(type => ({
      value: type.value,
      label: type.label
    }))
  })

  const typePresets = computed(() => {
    return types.value.reduce((acc, type) => {
      const preset = PRESET_CONFIG_BY_TYPE[type.value]
      if (!preset) return acc

      acc[type.value] = {
        description: preset.description,
        debitLabel: getAccountTypeLabel(preset.debit_account_types),
        debitAccountTypes: preset.debit_account_types,
        creditLabel: getAccountTypeLabel(preset.credit_account_types),
        creditAccountTypes: preset.credit_account_types
      }
      return acc
    }, {} as Record<string, {
      description: string
      debitLabel: string
      debitAccountTypes: AccountType[]
      creditLabel: string
      creditAccountTypes: AccountType[]
    }>)
  })

  async function loadTypes(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await transactionsApi.getTypes()
      defaultType.value = response.default

      types.value = response.types
      isLoaded.value = true
    } catch (err) {
      // Fallback to hardcoded types for backward compatibility
      console.warn('Failed to load transaction types from API, using fallback:', err)
      types.value = FALLBACK_TRANSACTION_TYPES
      defaultType.value = 'JOURNAL'
      isLoaded.value = true
    } finally {
      loading.value = false
    }
  }

  function getTypeByValue(value: string): TransactionTypeOption | undefined {
    return types.value.find(type => type.value === value)
  }

  function getPresetByValue(value: string) {
    return typePresets.value[value]
  }

  function getAccountTypeLabel(accountTypes: AccountType[]): string {
    if (accountTypes.length === 1) {
      return accountTypes[0].charAt(0) + accountTypes[0].slice(1).toLowerCase() + ' Account'
    }

    const labels = accountTypes.map(accountType =>
      accountType.charAt(0) + accountType.slice(1).toLowerCase()
    )

    return `${labels.join(' / ')} Account`
  }

  function clearError(): void {
    error.value = null
  }

  return {
    types,
    defaultType,
    isLoaded,
    loading,
    error,
    typeOptions,
    typePresets,
    loadTypes,
    getTypeByValue,
    getPresetByValue,
    clearError
  }
})
