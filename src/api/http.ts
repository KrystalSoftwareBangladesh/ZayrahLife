import type { TokenRefreshResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apizayrahlife.rkshaon.info'

interface RequestConfig extends Omit<globalThis.RequestInit, 'headers'> {
  skipAuth?: boolean
  headers?: Record<string, string>
}

interface QueuedRequest {
  resolve: (_value: string) => void
  reject: (_reason: unknown) => void
}

class HttpClient {
  private baseUrl: string
  private isRefreshing = false
  private refreshQueue: QueuedRequest[] = []

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

  clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('adminUser')
  }

  private processQueue(token: string | null, error: unknown = null): void {
    this.refreshQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else if (token) {
        resolve(token)
      } else {
        reject(new Error('Token refresh failed'))
      }
    })
    this.refreshQueue = []
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      this.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return null
    }

    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject })
      })
    }

    this.isRefreshing = true

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      })

      if (!response.ok) {
        this.clearTokens()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        this.processQueue(null, new Error('Refresh failed'))
        return null
      }

      const data: TokenRefreshResponse = await response.json()
      this.setAccessToken(data.access)
      this.processQueue(data.access)
      return data.access
    } catch (err) {
      this.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      this.processQueue(null, err)
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { skipAuth = false, headers: customHeaders = {}, ...restConfig } = config

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders as Record<string, string>
    }

    if (!skipAuth) {
      const token = this.getAccessToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const url = `${this.baseUrl}${endpoint}`
    let response = await fetch(url, { ...restConfig, headers })

    if (response.status === 401 && !skipAuth) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`
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
