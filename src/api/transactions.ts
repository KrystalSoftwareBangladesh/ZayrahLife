import http from './http'
import type {
  AccountingTransactionCreateRequest,
  AccountingTransactionDetail,
  AccountingTransactionList,
  AccountingTransactionListParams,
  AccountingTransactionPostRequest,
  AccountingTransactionUpdateRequest,
  PaginatedResponse,
  TransactionStatusListResponse
} from './types'

function buildQueryString(params: AccountingTransactionListParams): string {
  const query = new URLSearchParams()

  if (params.account !== undefined) query.set('account', String(params.account))
  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.ordering) query.set('ordering', params.ordering)
  if (params.status) query.set('status', params.status)
  if (params.transaction_date_min) query.set('transaction_date_min', params.transaction_date_min)
  if (params.transaction_date_max) query.set('transaction_date_max', params.transaction_date_max)

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const transactionsApi = {
  async list(params: AccountingTransactionListParams = {}): Promise<PaginatedResponse<AccountingTransactionList>> {
    const queryString = buildQueryString(params)
    return http.get<PaginatedResponse<AccountingTransactionList>>(`/api/v1/transactions/${queryString}`)
  },

  async getById(id: number): Promise<AccountingTransactionDetail> {
    return http.get<AccountingTransactionDetail>(`/api/v1/transactions/${id}/`)
  },

  async create(data: AccountingTransactionCreateRequest): Promise<AccountingTransactionDetail> {
    return http.post<AccountingTransactionDetail>('/api/v1/transactions/', data)
  },

  async update(id: number, data: AccountingTransactionUpdateRequest): Promise<AccountingTransactionDetail> {
    return http.patch<AccountingTransactionDetail>(`/api/v1/transactions/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/transactions/${id}/`)
  },

  async post(id: number, data: AccountingTransactionPostRequest): Promise<AccountingTransactionDetail> {
    return http.post<AccountingTransactionDetail>(`/api/v1/transactions/${id}/post/`, data)
  },

  async getStatuses(): Promise<TransactionStatusListResponse> {
    return http.get<TransactionStatusListResponse>('/api/v1/transactions/statuses/')
  }
}

export default transactionsApi
