import http from './http'
import type { PaginatedResponse, PaymentMethodListItem, PaymentMethodListParams } from './types'

function buildQueryString(params: PaymentMethodListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const paymentMethodsApi = {
  async list(params: PaymentMethodListParams = {}): Promise<PaginatedResponse<PaymentMethodListItem>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<PaymentMethodListItem>>(`/api/v1/payment-methods/${queryString}`)
  }
}

export default paymentMethodsApi
