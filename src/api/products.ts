import http from './http'
import type {
  PaginatedResponse,
  ProductCreateRequest,
  ProductCreateUpdateResponse,
  ProductDetail,
  ProductList,
  ProductListParams,
  ProductUpdateRequest,
  ProductVariantCreateRequest,
  ProductVariantList,
  ProductVariantListParams,
  ProductVariantUpdateRequest
} from './types'

function buildProductQueryString(params: ProductListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.category !== undefined) query.set('category', String(params.category))

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

function buildVariantQueryString(params: ProductVariantListParams): string {
  const query = new URLSearchParams()

  if (params.page) query.set('page', String(params.page))
  if (params.page_size) query.set('page_size', String(params.page_size))
  if (params.search) query.set('search', params.search)
  if (params.product !== undefined) query.set('product', String(params.product))

  const queryStr = query.toString()
  return queryStr ? `?${queryStr}` : ''
}

export const productsApi = {
  async list(params: ProductListParams = {}): Promise<PaginatedResponse<ProductList>> {
    const queryString = buildProductQueryString(params)
    return http.get<PaginatedResponse<ProductList>>(`/api/v1/products/${queryString}`)
  },

  async getById(id: number): Promise<ProductDetail> {
    return http.get<ProductDetail>(`/api/v1/products/${id}/`)
  },

  async create(data: ProductCreateRequest): Promise<ProductCreateUpdateResponse> {
    return http.post<ProductCreateUpdateResponse>('/api/v1/products/', data)
  },

  async update(id: number, data: ProductUpdateRequest): Promise<ProductCreateUpdateResponse> {
    return http.patch<ProductCreateUpdateResponse>(`/api/v1/products/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/products/${id}/`)
  }
}

export const productVariantsApi = {
  async list(params: ProductVariantListParams = {}): Promise<PaginatedResponse<ProductVariantList>> {
    const queryString = buildVariantQueryString(params)
    return http.get<PaginatedResponse<ProductVariantList>>(`/api/v1/product-variants/${queryString}`)
  },

  async create(data: ProductVariantCreateRequest): Promise<ProductVariantList> {
    return http.post<ProductVariantList>('/api/v1/product-variants/', data)
  },

  async update(id: number, data: ProductVariantUpdateRequest): Promise<ProductVariantList> {
    return http.patch<ProductVariantList>(`/api/v1/product-variants/${id}/`, data)
  },

  async delete(id: number): Promise<void> {
    return http.delete(`/api/v1/product-variants/${id}/`)
  }
}

export default productsApi
