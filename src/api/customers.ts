import http from './http'
import type {
  CustomerProfileList,
  CustomerProfileDetail,
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerListParams,
  PaginatedResponse
} from './types'

function buildQueryString(params: CustomerListParams): string {
  const query = new URLSearchParams()
  
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.customer_type) query.set('customer_type', params.customer_type)
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
  
  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const customersApi = {
  async list(params: CustomerListParams = {}): Promise<PaginatedResponse<CustomerProfileList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<CustomerProfileList>>(`/api/v1/customers/${queryString}`)
  },

  async getById(id: number): Promise<CustomerProfileDetail> {
    return http.get<CustomerProfileDetail>(`/api/v1/customers/${id}/`)
  },

  async create(data: CustomerCreateRequest): Promise<CustomerProfileDetail> {
    return http.post<CustomerProfileDetail>('/api/v1/customers/', data)
  },

  async update(id: number, data: CustomerUpdateRequest): Promise<CustomerProfileDetail> {
    return http.patch<CustomerProfileDetail>(`/api/v1/customers/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/customers/${id}/`)
  }
}

export default customersApi
