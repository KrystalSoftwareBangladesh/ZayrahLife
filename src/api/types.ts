export interface TokenPair {
  access: string
  refresh: string
}

export interface LoginRequest {
  credential: string
  password: string
}

export interface TokenRefreshRequest {
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
}

export interface UserProfile {
  id: number
  full_name: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  email: string | null
  username: string
  groups: number[]
}

export type CustomerType = 'POS' | 'FACEBOOK' | 'WEBSITE'

export interface CustomerProfileList {
  id: number
  full_name: string
  email: string
  phone: string | null
  facebook_profile_url: string | null
  customer_type: CustomerType
  created_at: string
}

export interface CustomerProfileDetail extends CustomerProfileList {
  first_name: string
  middle_name: string
  last_name: string
  notes: string
  is_active: boolean
  updated_at: string
}

export interface CustomerCreateRequest {
  first_name: string
  middle_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  facebook_profile_url?: string | null
  customer_type?: CustomerType
  notes?: string
}

export interface CustomerUpdateRequest {
  first_name?: string
  middle_name?: string
  last_name?: string
  phone?: string | null
  facebook_profile_url?: string | null
  customer_type?: CustomerType
  notes?: string
}

export interface CustomerProfileDetailRequest {
  phone?: string | null
  facebook_profile_url?: string | null
  customer_type?: CustomerType
  notes?: string
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CustomerListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  customer_type?: CustomerType
  is_active?: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parent: number | null
  created_at: string
  updated_at: string
}

export interface CategoryCreateRequest {
  name: string
  slug?: string
  description?: string | null
  parent?: number | null
}

export interface CategoryUpdateRequest {
  name?: string
  slug?: string
  description?: string | null
  parent?: number | null
}

export interface CategoryListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  parent?: number
  is_active?: boolean
}

export type SupplierPaymentType = 'COD' | 'CREDIT' | 'PREPAID'

export interface SupplierList {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  payment_type: SupplierPaymentType
  credit_days: number | null
  categories: string[]
}

export interface SupplierDetail {
  id: number
  categories: string[]
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  deleted_at: string | null
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  payment_type: SupplierPaymentType
  credit_days: number | null
}

export interface SupplierCreateUpdateResponse {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  payment_type: SupplierPaymentType
  credit_days: number | null
  categories: number[]
}

export interface SupplierCreateRequest {
  name: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  payment_type: SupplierPaymentType
  credit_days?: number | null
  categories?: number[]
}

export interface SupplierUpdateRequest {
  name?: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  payment_type?: SupplierPaymentType
  credit_days?: number | null
  categories?: number[]
}

export interface SupplierListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  payment_type?: SupplierPaymentType
  category?: number[]
}

export interface ProductVariantRequest {
  sku: string
  color?: string | null
  size?: string | null
}

export interface ProductList {
  id: number
  name: string
  category: string
  current_selling_price: string
}

export interface ProductDetail {
  id: number
  category: string
  price_histories: Array<{
    price: string
    changed_at: string
    changed_by: string
  }>
  created_at: string
  updated_at: string
  is_active: boolean
  deleted_at: string | null
  name: string
  current_selling_price: string
  created_by: number | null
  updated_by: number | null
}

export interface ProductCreateUpdateResponse {
  id: number
  name: string
  category: number | null
  current_selling_price: string
  variants: Array<{
    id: number
    sku: string
    color: string | null
    size: string | null
  }>
}

export interface ProductCreateRequest {
  name: string
  category?: number | null
  current_selling_price: string
  variants?: ProductVariantRequest[]
}

export interface ProductUpdateRequest {
  name?: string
  category?: number | null
  current_selling_price?: string
  variants?: ProductVariantRequest[]
}

export interface ProductListParams {
  page?: number
  page_size?: number
  search?: string
  category?: number
}

export interface ProductVariantList {
  id: number
  product: string
  sku: string
  color: string | null
  size: string | null
  current_stock: number
}

export interface ProductVariantCreateRequest {
  product: number
  sku: string
  color?: string | null
  size?: string | null
}

export interface ProductVariantUpdateRequest {
  product?: number
  sku?: string
  color?: string | null
  size?: string | null
}

export interface ProductVariantListParams {
  page?: number
  page_size?: number
  search?: string
  product?: number
}

export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface PurchaseItemRequest {
  product_variant_id: number
  quantity: number
  unit_cost: string
}

export interface PurchaseList {
  id: number
  supplier: SupplierList
  purchase_date: string
  invoice_number: string | null
  status: PurchaseStatus
  total_amount: string
}

export interface PurchaseDetailItem {
  id: number
  product_variant: ProductVariantList
  quantity: number
  unit_cost: string
  line_total: string
}

export interface PurchaseDetail {
  id: number
  supplier: SupplierList
  items: PurchaseDetailItem[]
  created_at: string
  updated_at: string
  is_active: boolean
  deleted_at: string | null
  purchase_date: string
  invoice_number: string | null
  status: PurchaseStatus
  subtotal_amount: string
  discount_amount: string
  tax_amount: string
  total_amount: string
  notes: string | null
  created_by: number | null
  updated_by: number | null
}

export interface PurchaseCreateRequest {
  supplier: number
  purchase_date: string
  invoice_number?: string | null
  discount_amount?: string
  tax_amount?: string
  notes?: string | null
  items: PurchaseItemRequest[]
}

export interface PurchaseUpdateRequest {
  supplier?: number
  purchase_date?: string
  invoice_number?: string | null
  discount_amount?: string
  tax_amount?: string
  notes?: string | null
  items?: PurchaseItemRequest[]
}

export interface PurchaseListParams {
  page?: number
  page_size?: number
  supplier?: number
  status?: PurchaseStatus
  purchase_date_min?: string
  purchase_date_max?: string
}

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface SaleCustomer {
  id: number
  full_name: string
  email: string
  phone?: string | null
}

export interface SaleProductVariant {
  id: number
  product: string
  sku: string
  color: string | null
  size: string | null
}

export interface SaleItem {
  id: number
  product_variant: SaleProductVariant | null
  quantity: number
  unit_price: string
  line_total: string
  product_id?: number | null
  product_name?: string
  variant?: string | null
}

export interface SaleList {
  id: number | string
  customer: SaleCustomer | number | null
  sale_date: string
  invoice_number: string | null
  status: SaleStatus
  total_amount: string
  created_at?: string
  order_number?: string | null
  customer_name?: string
  customer_email?: string | null
  channel?: string
}

export interface SaleDetail {
  id: number | string
  customer: SaleCustomer | number | null
  items: SaleItem[]
  created_at: string
  updated_at: string
  sale_date: string
  invoice_number: string | null
  status: SaleStatus
  subtotal_amount: string
  discount_amount: string
  tax_amount: string
  total_amount: string
  notes: string | null
  order_number?: string | null
  customer_name?: string
  customer_email?: string | null
  customer_phone?: string | null
  channel?: string
  payment_method?: string | null
  shipping_address?: string | null
  shipping_amount?: string
  tracking_number?: string | null
}

export interface SaleItemCreateRequest {
  product_variant_id: number
  quantity: number
  unit_price: string
  line_total: string
}

export interface SaleCreateRequest {
  customer: number
  sale_date: string
  invoice_number?: string | null
  discount_amount?: string
  tax_amount?: string
  notes?: string | null
  items: SaleItemCreateRequest[]
}

export interface SaleUpdateRequest {
  customer?: number
  sale_date?: string
  invoice_number?: string | null
  status?: SaleStatus
  discount_amount?: string
  tax_amount?: string
  notes?: string | null
  items?: SaleItemCreateRequest[]
}

export interface SaleDetailRequest {
  customer: number | CustomerProfileDetailRequest
  items: SaleItemCreateRequest[]
  sale_date: string
  is_active?: boolean
  deleted_at?: string | null
  invoice_number?: string | null
  status?: SaleStatus
  subtotal_amount?: string
  discount_amount?: string
  tax_amount?: string
  total_amount?: string
  notes?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface SaleListParams {
  page?: number
  page_size?: number
  search?: string
  status?: SaleStatus
  customer?: number
  start_date?: string
  end_date?: string
  ordering?: string
}

export interface ApiError {
  message: string
  status: number
  data?: unknown
}
