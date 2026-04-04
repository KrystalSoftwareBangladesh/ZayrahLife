<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import type { SupplierPaymentType } from '@/api/types'

interface SelectOption {
  value: string | number
  label: string
}

interface SupplierFormValues {
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  notes: string
  payment_type: SupplierPaymentType
  credit_days: string
  category_id: string
}

const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  submitText?: string
  categoryOptions?: SelectOption[]
  showCategory?: boolean
  categoryLabel?: string
  showEmptyCategoryState?: boolean
  emptyCategoryMessage?: string
  emptyCategoryButtonText?: string
  initialValues?: Partial<SupplierFormValues>
}>(), {
  title: 'Create Supplier',
  submitText: 'Save',
  categoryOptions: () => [],
  showCategory: false,
  categoryLabel: 'Category',
  showEmptyCategoryState: false,
  emptyCategoryMessage: 'No categories found.',
  emptyCategoryButtonText: 'Add Category',
  initialValues: () => ({})
})

const emit = defineEmits<{
  close: []
  submit: [payload: SupplierFormValues]
  createCategory: []
}>()

const paymentTypeOptions = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'PREPAID', label: 'Prepaid' }
] satisfies SelectOption[]

function buildFormValues(initialValues: Partial<SupplierFormValues> = {}): SupplierFormValues {
  return {
    name: initialValues.name || '',
    contact_person: initialValues.contact_person || '',
    phone: initialValues.phone || '',
    email: initialValues.email || '',
    address: initialValues.address || '',
    notes: initialValues.notes || '',
    payment_type: initialValues.payment_type || 'COD',
    credit_days: initialValues.credit_days || '',
    category_id: initialValues.category_id || 'none'
  }
}

const form = ref<SupplierFormValues>(buildFormValues(props.initialValues))

watch(
  () => [props.show, props.initialValues] as const,
  ([show]) => {
    if (show) {
      form.value = buildFormValues(props.initialValues)
    }
  },
  { deep: true }
)

const resolvedCategoryOptions = computed(() => {
  if (!props.showCategory) return []
  return [
    { value: 'none', label: 'No Category' },
    ...props.categoryOptions
  ]
})

const handleSubmit = () => {
  emit('submit', { ...form.value })
}
</script>

<template>
  <FormModal
    :show="show"
    :title="title"
    @close="emit('close')"
    @submit="handleSubmit"
  >
    <div class="space-y-4">
      <FormInput v-model="form.name" label="Supplier Name" placeholder="Company name" required />
      <div class="grid grid-cols-2 gap-4">
        <FormInput v-model="form.contact_person" label="Contact Person" placeholder="Contact name" />
        <FormInput v-model="form.phone" label="Phone" placeholder="Phone number" />
      </div>
      <FormInput v-model="form.email" label="Email" type="email" placeholder="Email address" />
      <FormInput v-model="form.address" label="Address" placeholder="Business address" />
      <div class="grid grid-cols-2 gap-4">
        <FormSelect v-model="form.payment_type" label="Payment Type" :options="paymentTypeOptions" />
        <FormInput
          v-model="form.credit_days"
          type="number"
          label="Credit Days"
          placeholder="Only for Credit payment"
          :disabled="form.payment_type !== 'CREDIT'"
        />
      </div>
      <template v-if="showCategory">
        <FormSelect
          v-model="form.category_id"
          :label="categoryLabel"
          :options="resolvedCategoryOptions"
        />
        <div
          v-if="showEmptyCategoryState"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <div class="flex items-center justify-between gap-3">
            <span>{{ emptyCategoryMessage }}</span>
            <button
              type="button"
              class="shrink-0 rounded-lg bg-primary-600 px-3 py-2 font-medium text-white transition-colors hover:bg-primary-700"
              @click="emit('createCategory')"
            >
              {{ emptyCategoryButtonText }}
            </button>
          </div>
        </div>
      </template>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Optional notes..."
        ></textarea>
      </div>
    </div>

    <template #actions>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        {{ submitText }}
      </button>
    </template>
  </FormModal>
</template>
