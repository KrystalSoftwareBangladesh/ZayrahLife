import http from './http'
import type { LoginRequest, TokenPair, UserProfile } from './types'

interface LoginResponse {
  access: string
  refresh: string
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenPair> {
    const response = await http.post<LoginResponse>(
      '/api/v1/auth/login/',
      credentials,
      { skipAuth: true }
    )
    
    localStorage.setItem('accessToken', response.access)
    localStorage.setItem('refreshToken', response.refresh)
    
    return response
  },

  async logout(): Promise<void> {
    try {
      await http.post('/api/v1/auth/logout/')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('adminUser')
    }
  },

  async getProfile(): Promise<UserProfile> {
    return http.get<UserProfile>('/api/v1/users/me/')
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return http.patch<UserProfile>('/api/v1/users/me/', data)
  }
}

export default authApi
