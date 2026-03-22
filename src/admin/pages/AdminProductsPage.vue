<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import { useAdminProductStore } from '@/stores/admin/productStore'
import { useCategoryStore } from '@/stores/admin/categoryStore'
import type { ProductList, ProductUpdateRequest, ProductVariantList } from '@/api/types'

interface VariantForm {
  sku: string
  color: string
  size: string
}

interface ProductForm {
  name: string
  category_id: string
  current_selling_price: string
  variants: VariantForm[]
}

const productStore = useAdminProductStore()
const categoryStore = useCategoryStore()

const searchQuery = ref('')
const categoryFilter = ref('')
const searchTimeout = ref<number | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showEditVariantModal = ref(false)
const showDeleteModal = ref(false)
const showDeleteVariantModal = ref(false)

const selectedProduct = ref<ProductList | null>(null)
const selectedVariant = ref<ProductVariantList | null>(null)
const selectedVariantId = ref<number | null>(null)

const createForm = ref<ProductForm>({
  name: '',
  category_id: 'none',
  current_selling_price: '',
  variants: [{ sku: '', color: '', size: '' }]
})

const editForm = ref<Omit<ProductForm, 'variants'>>({
  name: '',
  category_id: 'none',
  current_selling_price: ''
})

const newVariant = ref<VariantForm>({
  sku: '',
  color: '',
  size: ''
})

const editVariantForm = ref<VariantForm>({
  sku: '',
  color: '',
  size: ''
})

const columns = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category', width: '160px' },
  { key: 'current_selling_price', label: 'Price', width: '120px' },
  { key: 'actions', label: 'Actions', width: '150px' }
]

const categoryFilterOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...categoryStore.categoryOptions.map(category => ({
    value: String(category.id),
    label: category.name
  }))
])

const productCategoryOptions = computed(() => [
  { value: 'none', label: 'No Category' },
  ...categoryStore.categoryOptions.map(category => ({
    value: String(category.id),
    label: category.name
  }))
])

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategoryOptions(),
    productStore.fetchProducts()
  ])
})

onUnmounted(() => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})

const fetchProductList = (page = 1) => {
  productStore.fetchProducts({
    page,
    search: searchQuery.value || undefined,
    category: categoryFilter.value ? Number(categoryFilter.value) : undefined
  })
}

const handleSearch = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = window.setTimeout(() => {
    fetchProductList(1)
  }, 400)
}

const handleFilterChange = () => {
  fetchProductList(1)
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    category_id: 'none',
    current_selling_price: '',
    variants: [{ sku: '', color: '', size: '' }]
  }
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const addVariantToCreate = () => {
  createForm.value.variants.push({ sku: '', color: '', size: '' })
}

const removeVariantFromCreate = (index: number) => {
  if (createForm.value.variants.length > 1) {
    createForm.value.variants.splice(index, 1)
  }
}

const openEditModal = async (product: ProductList) => {
  selectedProduct.value = product
  const detail = await productStore.fetchProductDetail(product.id)
  if (!detail) return

  await productStore.fetchProductVariants(product.id)

  const matchedCategory = categoryStore.categoryOptions.find(
    category => category.name === detail.category
  )

  editForm.value = {
    name: detail.name,
    category_id: matchedCategory ? String(matchedCategory.id) : 'none',
    current_selling_price: detail.current_selling_price
  }
  showEditModal.value = true
}

const openDeleteModal = (product: ProductList) => {
  selectedProduct.value = product
  showDeleteModal.value = true
}

const handleCreateProduct = async () => {
  if (!createForm.value.name.trim() || !createForm.value.current_selling_price) return

  const variants = createForm.value.variants
    .filter(variant => variant.sku.trim())
    .map(variant => ({
      sku: variant.sku.trim(),
      color: variant.color.trim() || null,
      size: variant.size.trim() || null
    }))

  const success = await productStore.createProduct({
    name: createForm.value.name.trim(),
    category: createForm.value.category_id === 'none' ? null : Number(createForm.value.category_id),
    current_selling_price: createForm.value.current_selling_price,
    variants: variants.length ? variants : undefined
  })

  if (success) {
    showCreateModal.value = false
    fetchProductList(1)
  }
}

const handleUpdateProduct = async () => {
  if (!selectedProduct.value || !productStore.currentProduct || !editForm.value.name.trim()) return

  const payload: ProductUpdateRequest = {}
  const current = productStore.currentProduct
  const name = editForm.value.name.trim()
  const price = editForm.value.current_selling_price
  const categoryId = editForm.value.category_id === 'none' ? null : Number(editForm.value.category_id)
  const currentCategoryId = categoryStore.categoryOptions.find(
    category => category.name === current.category
  )?.id ?? null

  if (name !== current.name) payload.name = name
  if (price !== current.current_selling_price) payload.current_selling_price = price
  if (categoryId !== currentCategoryId) payload.category = categoryId

  if (Object.keys(payload).length === 0) {
    showEditModal.value = false
    return
  }

  const success = await productStore.updateProduct(selectedProduct.value.id, payload)
  if (success) {
    showEditModal.value = false
    fetchProductList(productStore.pagination.page)
  }
}

const handleDeleteProduct = async () => {
  if (!selectedProduct.value) return
  const success = await productStore.deleteProduct(selectedProduct.value.id)
  if (success) {
    showDeleteModal.value = false
    selectedProduct.value = null
    fetchProductList(productStore.pagination.page)
  }
}

const handleAddVariant = async () => {
  if (!selectedProduct.value || !newVariant.value.sku.trim()) return

  const success = await productStore.createVariant({
    product: selectedProduct.value.id,
    sku: newVariant.value.sku.trim(),
    color: newVariant.value.color.trim() || null,
    size: newVariant.value.size.trim() || null
  })

  if (success) {
    newVariant.value = { sku: '', color: '', size: '' }
  }
}

const openEditVariantModal = (variant: ProductVariantList) => {
  selectedVariant.value = variant
  editVariantForm.value = {
    sku: variant.sku,
    color: variant.color || '',
    size: variant.size || ''
  }
  showEditVariantModal.value = true
}

const handleUpdateVariant = async () => {
  if (!selectedProduct.value || !selectedVariant.value || !editVariantForm.value.sku.trim()) return

  const payload = {
    product: selectedProduct.value.id,
    sku: editVariantForm.value.sku.trim(),
    color: editVariantForm.value.color.trim() || null,
    size: editVariantForm.value.size.trim() || null
  }

  const success = await productStore.updateVariant(selectedVariant.value.id, selectedProduct.value.id, payload)
  if (success) {
    showEditVariantModal.value = false
    selectedVariant.value = null
  }
}

const openDeleteVariantModal = (variantId: number) => {
  selectedVariantId.value = variantId
  showDeleteVariantModal.value = true
}

const handleDeleteVariant = async () => {
  if (!selectedProduct.value || !selectedVariantId.value) return
  const success = await productStore.deleteVariant(selectedVariantId.value, selectedProduct.value.id)
  if (success) {
    showDeleteVariantModal.value = false
    selectedVariantId.value = null
  }
}

const handlePageChange = (page: number) => {
  fetchProductList(page)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Products</h1>
        <p class="text-gray-500 mt-1">Manage product listing and lifecycle</p>
      </div>
      <button
        @click="openCreateModal"
        class="p-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        aria-label="Add product"
        title="Add product"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div v-if="productStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {{ productStore.error }}
      <button @click="productStore.clearError" class="ml-2 underline">Dismiss</button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 max-w-md">
          <FormInput
            v-model="searchQuery"
            placeholder="Search products..."
            @input="handleSearch"
          />
        </div>
        <div class="w-52">
          <FormSelect
            v-model="categoryFilter"
            :options="categoryFilterOptions"
            placeholder="All Categories"
            @update:model-value="handleFilterChange"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ productStore.totalProducts }} products
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="productStore.products"
      :loading="productStore.loading"
      @row-click="openEditModal"
    >
      <template #name="{ row }">
        <span class="font-medium">{{ row.name }}</span>
      </template>
      <template #current_selling_price="{ value }">
        <span class="font-medium">${{ Number(value).toFixed(2) }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="openEditModal(row)"
            class="p-2 text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
            aria-label="Edit product"
            title="Edit product"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z" />
            </svg>
          </button>
          <button
            @click.stop="openDeleteModal(row)"
            class="p-2 text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
            aria-label="Delete product"
            title="Delete product"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="productStore.pagination.count > productStore.pagination.pageSize" class="flex justify-center gap-2">
      <button
        :disabled="!productStore.pagination.hasPrevious"
        @click="handlePageChange(productStore.pagination.page - 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span class="px-3 py-1">
        Page {{ productStore.pagination.page }} of {{ Math.ceil(productStore.pagination.count / productStore.pagination.pageSize) }}
      </span>
      <button
        :disabled="!productStore.pagination.hasNext"
        @click="handlePageChange(productStore.pagination.page + 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

    <FormModal
      :show="showCreateModal"
      title="Create Product"
      size="lg"
      @close="showCreateModal = false"
      @submit="handleCreateProduct"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="createForm.name" label="Product Name" placeholder="Enter product name" required />
          <FormSelect v-model="createForm.category_id" label="Category" :options="productCategoryOptions" />
        </div>
        <FormInput
          v-model="createForm.current_selling_price"
          label="Selling Price"
          type="number"
          step="0.01"
          placeholder="0.00"
        />

        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Initial Variants (Optional)</h4>
            <button
              type="button"
              @click="addVariantToCreate"
              class="p-2 text-primary-600 hover:text-primary-700 rounded transition-colors"
              aria-label="Add variant"
              title="Add variant"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div v-for="(variant, index) in createForm.variants" :key="index" class="p-3 bg-gray-50 rounded-lg mb-2">
            <div class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-3 gap-3">
                <FormInput v-model="variant.sku" placeholder="SKU (required to include variant)" />
                <FormInput v-model="variant.color" placeholder="Color" />
                <FormInput v-model="variant.size" placeholder="Size" />
              </div>
              <button
                v-if="createForm.variants.length > 1"
                type="button"
                @click="removeVariantFromCreate(index)"
                class="p-1 text-red-500 hover:text-red-700"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormModal>

    <FormModal
      :show="showEditModal"
      title="Edit Product"
      size="lg"
      @close="showEditModal = false"
      @submit="handleUpdateProduct"
    >
      <div class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="editForm.name" label="Product Name" placeholder="Product name" required />
          <FormSelect v-model="editForm.category_id" label="Category" :options="productCategoryOptions" />
        </div>
        <FormInput
          v-model="editForm.current_selling_price"
          label="Selling Price"
          type="number"
          step="0.01"
          placeholder="0.00"
        />

        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-3">Variants</h4>
          <div v-if="productStore.currentProductVariants.length === 0" class="text-sm text-gray-500 mb-3">
            No variants found for this product.
          </div>
          <div v-else class="space-y-2 mb-4">
            <div
              v-for="variant in productStore.currentProductVariants"
              :key="variant.id"
              class="p-3 border border-gray-200 rounded-lg flex items-center justify-between"
            >
              <div>
                <div class="font-medium text-gray-900">{{ variant.sku }}</div>
                <div class="text-sm text-gray-500">
                  {{ variant.color || '-' }} / {{ variant.size || '-' }} | Stock: {{ variant.current_stock }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="openEditVariantModal(variant)"
                  class="p-2 text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
                  aria-label="Edit variant"
                  title="Edit variant"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="openDeleteVariantModal(variant.id)"
                  class="p-2 text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  aria-label="Delete variant"
                  title="Delete variant"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-sm font-medium text-gray-700 mb-2">Add Variant</div>
            <div class="grid grid-cols-3 gap-3">
              <FormInput v-model="newVariant.sku" placeholder="SKU" />
              <FormInput v-model="newVariant.color" placeholder="Color" />
              <FormInput v-model="newVariant.size" placeholder="Size" />
            </div>
            <div class="mt-3">
              <button
                type="button"
                @click="handleAddVariant"
                class="p-2 text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
                aria-label="Add variant"
                title="Add variant"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Product"
      :message="`Are you sure you want to delete '${selectedProduct?.name || ''}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDeleteProduct"
      @cancel="showDeleteModal = false"
    />

    <FormModal
      :show="showEditVariantModal"
      title="Edit Variant"
      size="md"
      @close="showEditVariantModal = false"
      @submit="handleUpdateVariant"
    >
      <div class="space-y-4">
        <FormInput v-model="editVariantForm.sku" label="SKU" placeholder="SKU" required />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="editVariantForm.color" label="Color" placeholder="Color" />
          <FormInput v-model="editVariantForm.size" label="Size" placeholder="Size" />
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteVariantModal"
      title="Delete Variant"
      message="Are you sure you want to delete this variant?"
      confirm-text="Delete"
      @confirm="handleDeleteVariant"
      @cancel="showDeleteVariantModal = false"
    />
  </div>
</template>
