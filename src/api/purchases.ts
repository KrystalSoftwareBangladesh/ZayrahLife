import http from './http'
import type {
  PaginatedResponse,
  PurchaseCreateRequest,
  PurchaseDetail,
  PurchaseList,
  PurchaseListParams,
  PurchaseUpdateRequest
} from './types'

function buildQueryString(params: PurchaseListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.supplier !== undefined) query.set('supplier', String(params.supplier))
  if (params.status) query.set('status', params.status)
  if (params.purchase_date_min) query.set('purchase_date_min', params.purchase_date_min)
  if (params.purchase_date_max) query.set('purchase_date_max', params.purchase_date_max)

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const purchasesApi = {
  async list(params: PurchaseListParams = {}): Promise<PaginatedResponse<PurchaseList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<PurchaseList>>(`/api/v1/purchases/${queryString}`)
  },

  async getById(id: number): Promise<PurchaseDetail> {
    return http.get<PurchaseDetail>(`/api/v1/purchases/${id}/`)
  },

  async create(data: PurchaseCreateRequest): Promise<PurchaseDetail> {
    return http.post<PurchaseDetail>('/api/v1/purchases/', data)
  },

  async update(id: number, data: PurchaseUpdateRequest): Promise<PurchaseDetail> {
    return http.patch<PurchaseDetail>(`/api/v1/purchases/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/purchases/${id}/`)
  },

  async confirm(id: number, data: PurchaseCreateRequest): Promise<PurchaseDetail> {
    return http.post<PurchaseDetail>(`/api/v1/purchases/${id}/confirm/`, data)
  },

  async cancel(id: number, data: PurchaseCreateRequest): Promise<PurchaseDetail> {
    return http.post<PurchaseDetail>(`/api/v1/purchases/${id}/cancel/`, data)
  }
}

export default purchasesApi
