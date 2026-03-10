import http from './http'
import type {
  ChartOfAccountCreateRequest,
  ChartOfAccountCreateUpdateResponse,
  ChartOfAccountDetail,
  ChartOfAccountList,
  ChartOfAccountListParams,
  ChartOfAccountUpdateRequest,
  PaginatedResponse
} from './types'

function buildQueryString(params: ChartOfAccountListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.parent !== undefined) query.set('parent', String(params.parent))
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
  if (params.account_type) query.set('account_type', params.account_type)

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const accountsApi = {
  async list(params: ChartOfAccountListParams = {}): Promise<PaginatedResponse<ChartOfAccountList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<ChartOfAccountList>>(`/api/v1/chart-of-accounts/${queryString}`)
  },

  async getById(id: number): Promise<ChartOfAccountDetail> {
    return http.get<ChartOfAccountDetail>(`/api/v1/chart-of-accounts/${id}/`)
  },

  async create(data: ChartOfAccountCreateRequest): Promise<ChartOfAccountCreateUpdateResponse> {
    return http.post<ChartOfAccountCreateUpdateResponse>('/api/v1/chart-of-accounts/', data)
  },

  async update(id: number, data: ChartOfAccountUpdateRequest): Promise<ChartOfAccountCreateUpdateResponse> {
    return http.patch<ChartOfAccountCreateUpdateResponse>(`/api/v1/chart-of-accounts/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/chart-of-accounts/${id}/`)
  }
}

export default accountsApi
