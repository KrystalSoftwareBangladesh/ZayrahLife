import type { TokenRefreshResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zayrahlife.com'

interface RequestConfig extends RequestInit {
  skipAuth?: boolean
}

class HttpClient {
  private baseUrl: string
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  private setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token)
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('adminUser')
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      return null
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh(refreshToken)

    try {
      const newToken = await this.refreshPromise
      return newToken
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      })

      if (!response.ok) {
        this.clearTokens()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return null
      }

      const data: TokenRefreshResponse = await response.json()
      this.setAccessToken(data.access)
      return data.access
    } catch {
      this.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return null
    }
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipAuth = false, headers: customHeaders = {}, ...restConfig } = config

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>
    }

    if (!skipAuth) {
      const token = this.getAccessToken()
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
      }
    }

    const url = `${this.baseUrl}${endpoint}`
    let response = await fetch(url, { ...restConfig, headers })

    if (response.status === 401 && !skipAuth) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
        response = await fetch(url, { ...restConfig, headers })
      } else {
        throw { message: 'Session expired', status: 401 }
      }
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = null
      }
      throw {
        message: errorData?.detail || errorData?.message || 'Request failed',
        status: response.status,
        data: errorData
      }
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }
}

export const http = new HttpClient(API_BASE_URL)
export default http
