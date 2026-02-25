<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import { useCategoryStore } from '@/stores/admin/categoryStore'
import type { Category, CategoryUpdateRequest } from '@/api/types'

interface CategoryForm {
  name: string
  slug: string
  description: string
  parent: string
}

const categoryStore = useCategoryStore()

const searchQuery = ref('')
const searchTimeout = ref<number | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

const selectedCategory = ref<Category | null>(null)

const createForm = ref<CategoryForm>({
  name: '',
  slug: '',
  description: '',
  parent: 'none'
})

const editForm = ref<CategoryForm>({
  name: '',
  slug: '',
  description: '',
  parent: 'none'
})

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug', width: '180px' },
  { key: 'parent', label: 'Parent', width: '180px' },
  { key: 'updated_at', label: 'Updated', width: '140px' },
  { key: 'actions', label: 'Actions', width: '150px' }
]

const parentOptionsForCreate = computed(() => {
  return [
    { value: 'none', label: 'No Parent (Root Category)' },
    ...categoryStore.categoryOptions.map(category => ({
      value: String(category.id),
      label: category.name
    }))
  ]
})

const parentOptionsForEdit = computed(() => {
  return [
    { value: 'none', label: 'No Parent (Root Category)' },
    ...categoryStore.categoryOptions
      .filter(category => category.id !== selectedCategory.value?.id)
      .map(category => ({
        value: String(category.id),
        label: category.name
      }))
  ]
})

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories(),
    categoryStore.fetchCategoryOptions()
  ])
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    categoryStore.fetchCategories({ search: searchQuery.value, page: 1 })
  }, 400)
}

const formatDate = (value: string): string => {
  return value ? new Date(value).toLocaleDateString() : '-'
}

const getParentName = (parentId: number | null): string => {
  return parentId ? categoryStore.getCategoryNameById(parentId) : 'Root'
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    slug: '',
    description: '',
    parent: 'none'
  }
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const openEditModal = (category: Category) => {
  selectedCategory.value = category
  editForm.value = {
    name: category.name,
    slug: category.slug || '',
    description: category.description || '',
    parent: category.parent ? String(category.parent) : 'none'
  }
  showEditModal.value = true
}

const openDeleteModal = (category: Category) => {
  selectedCategory.value = category
  showDeleteModal.value = true
}

const handleCreate = async () => {
  if (!createForm.value.name.trim()) return

  const created = await categoryStore.createCategory({
    name: createForm.value.name.trim(),
    slug: createForm.value.slug.trim() || undefined,
    description: createForm.value.description.trim() || null,
    parent: createForm.value.parent === 'none' ? null : Number(createForm.value.parent)
  })

  if (created) {
    showCreateModal.value = false
  }
}

const handleEdit = async () => {
  if (!selectedCategory.value || !editForm.value.name.trim()) return

  const payload: CategoryUpdateRequest = {}
  const name = editForm.value.name.trim()
  const slug = editForm.value.slug.trim()
  const description = editForm.value.description.trim() || null
  const parent = editForm.value.parent === 'none' ? null : Number(editForm.value.parent)

  if (name !== selectedCategory.value.name) {
    payload.name = name
  }

  if (slug !== (selectedCategory.value.slug || '')) {
    payload.slug = slug || undefined
  }

  if (description !== (selectedCategory.value.description || null)) {
    payload.description = description
  }

  if (parent !== selectedCategory.value.parent) {
    payload.parent = parent
  }

  if (Object.keys(payload).length === 0) {
    showEditModal.value = false
    return
  }

  const updated = await categoryStore.updateCategory(selectedCategory.value.id, payload)

  if (updated) {
    showEditModal.value = false
  }
}

const handleDelete = async () => {
  if (!selectedCategory.value) return

  const deleted = await categoryStore.deleteCategory(selectedCategory.value.id)
  if (deleted) {
    showDeleteModal.value = false
    selectedCategory.value = null
  }
}

const handlePageChange = (page: number) => {
  categoryStore.setPage(page)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
        <p class="text-gray-500 mt-1">Create and manage product category hierarchy</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>
    </div>

    <div v-if="categoryStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {{ categoryStore.error }}
      <button @click="categoryStore.clearError" class="ml-2 underline">Dismiss</button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 max-w-md">
          <FormInput
            v-model="searchQuery"
            placeholder="Search categories..."
            @input="handleSearch"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ categoryStore.totalCategories }} categories
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="categoryStore.categories"
      :loading="categoryStore.loading"
      @row-click="openEditModal"
    >
      <template #name="{ row }">
        <span class="font-medium">{{ row.name }}</span>
      </template>
      <template #slug="{ value }">
        <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{{ value || '-' }}</span>
      </template>
      <template #parent="{ value }">
        {{ getParentName(value) }}
      </template>
      <template #updated_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="openEditModal(row)"
            class="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            Edit
          </button>
          <button
            @click.stop="openDeleteModal(row)"
            class="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="categoryStore.pagination.count > categoryStore.pagination.pageSize" class="flex justify-center gap-2">
      <button
        :disabled="!categoryStore.pagination.hasPrevious"
        @click="handlePageChange(categoryStore.pagination.page - 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span class="px-3 py-1">
        Page {{ categoryStore.pagination.page }} of {{ Math.ceil(categoryStore.pagination.count / categoryStore.pagination.pageSize) }}
      </span>
      <button
        :disabled="!categoryStore.pagination.hasNext"
        @click="handlePageChange(categoryStore.pagination.page + 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

    <FormModal
      :show="showCreateModal"
      title="Create Category"
      @close="showCreateModal = false"
      @submit="handleCreate"
    >
      <div class="space-y-4">
        <FormInput
          v-model="createForm.name"
          label="Name"
          placeholder="Category name"
          required
        />
        <FormInput
          v-model="createForm.slug"
          label="Slug"
          placeholder="Optional slug (auto-generated if blank)"
        />
        <FormSelect
          v-model="createForm.parent"
          label="Parent Category"
          :options="parentOptionsForCreate"
          placeholder="Select parent category"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="createForm.description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Optional description..."
          ></textarea>
        </div>
      </div>
    </FormModal>

    <FormModal
      :show="showEditModal"
      title="Edit Category"
      @close="showEditModal = false"
      @submit="handleEdit"
    >
      <div class="space-y-4">
        <FormInput
          v-model="editForm.name"
          label="Name"
          placeholder="Category name"
          required
        />
        <FormInput
          v-model="editForm.slug"
          label="Slug"
          placeholder="Optional slug"
        />
        <FormSelect
          v-model="editForm.parent"
          label="Parent Category"
          :options="parentOptionsForEdit"
          placeholder="Select parent category"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="editForm.description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Optional description..."
          ></textarea>
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Category"
      :message="`Are you sure you want to delete '${selectedCategory?.name || ''}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
