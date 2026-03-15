import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionsApi } from '@/api/transactions'
import type { TransactionTypeOption, AccountType } from '@/api/types'

interface TransactionTypePreset {
  debit_account_types: AccountType[]
  credit_account_types: AccountType[]
  description: string
  debit_label: string
  credit_label: string
  amount_label?: string
  debit_note_label?: string
  credit_note_label?: string
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
    value: 'INVESTMENT',
    label: 'Investment'
  },
  {
    value: 'OWNER_WITHDRAWAL',
    label: 'Owner Withdrawal'
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
    description: 'Record an outgoing payment by choosing what the payment was for and where the money was paid from.',
    debit_label: 'Payment For',
    credit_label: 'Paid From',
    amount_label: 'Payment Amount',
    debit_note_label: 'Payment Note',
    credit_note_label: 'Source Note'
  },
  RECEIPT: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['REVENUE', 'LIABILITY', 'EQUITY'],
    description: 'Record money received by choosing where it was received to and who or what it came from.',
    debit_label: 'Received To',
    credit_label: 'Received From',
    amount_label: 'Received Amount',
    debit_note_label: 'Receipt Note',
    credit_note_label: 'Source Note'
  },
  INVESTMENT: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['EQUITY'],
    description: 'Record money introduced into the business by choosing the receiving cash/bank account and the owner capital account.',
    debit_label: 'Received To',
    credit_label: 'Capital Account',
    amount_label: 'Investment Amount',
    debit_note_label: 'Receipt Note',
    credit_note_label: 'Capital Note'
  },
  OWNER_WITHDRAWAL: {
    debit_account_types: ['EQUITY'],
    credit_account_types: ['ASSET'],
    description: 'Record money taken out by choosing the owner drawing account and where the money was withdrawn from.',
    debit_label: 'Owner Account',
    credit_label: 'Withdrawn From',
    amount_label: 'Withdrawal Amount',
    debit_note_label: 'Owner Note',
    credit_note_label: 'Payment Note'
  },
  PURCHASE: {
    debit_account_types: ['EXPENSE', 'ASSET'],
    credit_account_types: ['LIABILITY', 'ASSET'],
    description: 'Record a purchase by choosing what was bought and how it was paid or booked.',
    debit_label: 'Purchased For',
    credit_label: 'Paid Via',
    amount_label: 'Purchase Amount',
    debit_note_label: 'Purchase Note',
    credit_note_label: 'Payment Note'
  },
  SALE: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['REVENUE', 'LIABILITY'],
    description: 'Record a sale by choosing where the money will be received and which income account it belongs to.',
    debit_label: 'Received To',
    credit_label: 'Sales Account',
    amount_label: 'Sales Amount',
    debit_note_label: 'Receipt Note',
    credit_note_label: 'Sales Note'
  },
  OPENING_BALANCE: {
    debit_account_types: ['ASSET', 'EXPENSE'],
    credit_account_types: ['LIABILITY', 'EQUITY', 'REVENUE'],
    description: 'Capture opening balances when setting up the books or starting a new period.',
    debit_label: 'Opening Debit Side',
    credit_label: 'Opening Credit Side',
    amount_label: 'Opening Amount',
    debit_note_label: 'Opening Note',
    credit_note_label: 'Opening Note'
  },
  TRANSFER: {
    debit_account_types: ['ASSET'],
    credit_account_types: ['ASSET'],
    description: 'Move money or value between two asset accounts such as cash and bank.',
    debit_label: 'Transfer To',
    credit_label: 'Transfer From',
    amount_label: 'Transfer Amount',
    debit_note_label: 'Destination Note',
    credit_note_label: 'Source Note'
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
        debitLabel: preset.debit_label,
        debitAccountTypes: preset.debit_account_types,
        creditLabel: preset.credit_label,
        creditAccountTypes: preset.credit_account_types,
        amountLabel: preset.amount_label || 'Amount',
        debitNoteLabel: preset.debit_note_label || `${preset.debit_label} Note`,
        creditNoteLabel: preset.credit_note_label || `${preset.credit_label} Note`
      }
      return acc
    }, {} as Record<string, {
      description: string
      debitLabel: string
      debitAccountTypes: AccountType[]
      creditLabel: string
      creditAccountTypes: AccountType[]
      amountLabel: string
      debitNoteLabel: string
      creditNoteLabel: string
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
