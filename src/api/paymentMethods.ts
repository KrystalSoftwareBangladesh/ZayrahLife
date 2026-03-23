import http from './http'
import type {
  PaginatedResponse,
  PaymentMethodCreateUpdateRequest,
  PaymentMethodCreateUpdateResponse,
  PaymentMethodDetail,
  PaymentMethodListItem,
  PaymentMethodListParams
} from './types'

function buildQueryString(params: PaymentMethodListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
  if (params.allow_account_override !== undefined) {
    query.set('allow_account_override', String(params.allow_account_override))
  }

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const paymentMethodsApi = {
  async list(params: PaymentMethodListParams = {}): Promise<PaginatedResponse<PaymentMethodListItem>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<PaymentMethodListItem>>(`/api/v1/payment-methods/${queryString}`)
  },

  async getById(id: number): Promise<PaymentMethodDetail> {
    return http.get<PaymentMethodDetail>(`/api/v1/payment-methods/${id}/`)
  },

  async create(data: PaymentMethodCreateUpdateRequest): Promise<PaymentMethodCreateUpdateResponse> {
    return http.post<PaymentMethodCreateUpdateResponse>('/api/v1/payment-methods/', data)
  },

  async update(id: number, data: PaymentMethodCreateUpdateRequest): Promise<PaymentMethodCreateUpdateResponse> {
    return http.patch<PaymentMethodCreateUpdateResponse>(`/api/v1/payment-methods/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/payment-methods/${id}/`)
  }
}

export default paymentMethodsApi
