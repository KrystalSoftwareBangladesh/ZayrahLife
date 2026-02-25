import http from './http'
import type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryListParams,
  PaginatedResponse
} from './types'

function buildQueryString(params: CategoryListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.parent !== undefined) query.set('parent', String(params.parent))
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const categoriesApi = {
  async list(params: CategoryListParams = {}): Promise<PaginatedResponse<Category>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<Category>>(`/api/v1/categories/${queryString}`)
  },

  async getById(id: number): Promise<Category> {
    return http.get<Category>(`/api/v1/categories/${id}/`)
  },

  async create(data: CategoryCreateRequest): Promise<Category> {
    return http.post<Category>('/api/v1/categories/', data)
  },

  async update(id: number, data: CategoryUpdateRequest): Promise<Category> {
    return http.patch<Category>(`/api/v1/categories/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/categories/${id}/`)
  }
}

export default categoriesApi
