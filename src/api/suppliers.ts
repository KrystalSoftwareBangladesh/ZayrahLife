import http from './http'
import type {
  PaginatedResponse,
  SupplierCreateRequest,
  SupplierCreateUpdateResponse,
  SupplierDetail,
  SupplierList,
  SupplierListParams,
  SupplierUpdateRequest
} from './types'

function buildQueryString(params: SupplierListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.payment_type) query.set('payment_type', params.payment_type)
  if (params.category?.length) {
    params.category.forEach(categoryId => query.append('category', String(categoryId)))
  }

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const suppliersApi = {
  async list(params: SupplierListParams = {}): Promise<PaginatedResponse<SupplierList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<SupplierList>>(`/api/v1/suppliers/${queryString}`)
  },

  async getById(id: number): Promise<SupplierDetail> {
    return http.get<SupplierDetail>(`/api/v1/suppliers/${id}/`)
  },

  async create(data: SupplierCreateRequest): Promise<SupplierCreateUpdateResponse> {
    return http.post<SupplierCreateUpdateResponse>('/api/v1/suppliers/', data)
  },

  async update(id: number, data: SupplierUpdateRequest): Promise<SupplierCreateUpdateResponse> {
    return http.patch<SupplierCreateUpdateResponse>(`/api/v1/suppliers/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/suppliers/${id}/`)
  }
}

export default suppliersApi
