import http from './http'
import type {
  PaginatedResponse,
  SaleChannelsResponse,
  SaleCreateRequest,
  SaleDetail,
  SaleDetailRequest,
  SaleList,
  SaleListParams,
  SaleUpdateRequest
} from './types'

function buildQueryString(params: SaleListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.customer) query.set('customer', String(params.customer))
  if (params.start_date) query.set('start_date', params.start_date)
  if (params.end_date) query.set('end_date', params.end_date)
  if (params.ordering) query.set('ordering', params.ordering)

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const salesApi = {
  async getChannels(): Promise<SaleChannelsResponse> {
    return http.get<SaleChannelsResponse>('/api/v1/sales/channels/')
  },

  async list(params: SaleListParams = {}): Promise<PaginatedResponse<SaleList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<SaleList>>(`/api/v1/sales/${queryString}`)
  },

  async getById(id: number | string): Promise<SaleDetail> {
    return http.get<SaleDetail>(`/api/v1/sales/${id}/`)
  },

  async create(data: SaleCreateRequest): Promise<SaleDetail> {
    return http.post<SaleDetail>('/api/v1/sales/', data)
  },

  async update(id: number | string, data: SaleUpdateRequest): Promise<SaleDetail> {
    return http.patch<SaleDetail>(`/api/v1/sales/${id}/`, data)
  },

  async replace(id: number | string, data: SaleUpdateRequest): Promise<SaleDetail> {
    return http.put<SaleDetail>(`/api/v1/sales/${id}/`, data)
  },

  async delete(id: number | string): Promise<void> {
    return http.delete(`/api/v1/sales/${id}/`)
  },

  async confirm(id: number | string, data: SaleDetailRequest): Promise<SaleDetail> {
    return http.post<SaleDetail>(`/api/v1/sales/${id}/confirm/`, data)
  },

  async cancel(id: number | string, data: SaleDetailRequest): Promise<SaleDetail> {
    return http.post<SaleDetail>(`/api/v1/sales/${id}/cancel/`, data)
  }
}

export default salesApi
