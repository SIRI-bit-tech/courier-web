import axios from "axios"

// ✅ SOLUTION: Use absolute URL that Next.js won't intercept
const API_URL = "http://127.0.0.1:8000"

// Create axios instance with specific configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: "customer" | "driver" | "admin"
  phone_number: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  is_active_driver?: boolean
  driver_license?: string
  vehicle_info?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  user_type: "customer" | "driver"
  phone_number: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
}

// Package interfaces
export interface Package {
  id: number
  tracking_number: string
  status: string
  sender: number
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  receiver_city: string
  receiver_state: string
  receiver_zip_code: string
  weight: number
  length: number
  width: number
  height: number
  package_type: string
  description: string
  current_location: string
  current_latitude?: number
  current_longitude?: number
  estimated_delivery: string
  created_at: string
  updated_at: string
}

export interface CreatePackageData {
  weight: string
  length: string
  width: string
  height: string
  package_type: string
  description: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  receiver_city: string
  receiver_state: string
  receiver_zip_code: string
}

class AuthService {
  private tokenKey = "swiftcourier_token"
  private refreshTokenKey = "swiftcourier_refresh_token"

  async login(credentials: LoginCredentials) {
    try {
      // ✅ FIXED: Use apiClient instead of direct axios to avoid Next.js interception
      const response = await apiClient.post('/api/auth/token/', credentials)
      const { access, refresh } = response.data

      localStorage.setItem(this.tokenKey, access)
      localStorage.setItem(this.refreshTokenKey, refresh)

      // Set default authorization header
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`

      return { success: true, tokens: { access, refresh } }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      }
    }
  }

  async register(data: RegisterData) {
    try {
      // ✅ FIXED: Use apiClient instead of direct axios
      const response = await apiClient.post('/api/accounts/register/', data)
      return { success: true, user: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || "Registration failed",
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      // ✅ FIXED: Use apiClient with explicit Authorization header
      const response = await apiClient.get('/api/accounts/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      this.logout()
      return null
    }
  }

  async updateProfile(profileData: Partial<User>) {
    const token = this.getToken()
    if (!token) throw new Error("Not authenticated")

    try {
      const response = await apiClient.patch('/api/accounts/profile/', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { success: true, user: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || "Profile update failed",
      }
    }
  }

  async createPackage(packageData: CreatePackageData) {
    const token = this.getToken()
    if (!token) throw new Error("Not authenticated")

    try {
      const response = await apiClient.post('/api/packages/', packageData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return { success: true, package: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || "Package creation failed",
      }
    }
  }

  async trackPackage(trackingNumber: string) {
    try {
      const response = await apiClient.get(`/api/packages/${trackingNumber}/track/`)
      return { success: true, package: response.data }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || "Package tracking failed",
      }
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshTokenKey)
    if (!refreshToken) return false

    try {
      // ✅ FIXED: Use apiClient
      const response = await apiClient.post('/api/auth/token/refresh/', {
        refresh: refreshToken,
      })

      const { access } = response.data
      localStorage.setItem(this.tokenKey, access)
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`

      return true
    } catch (error) {
      this.logout()
      return false
    }
  }

  logout() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    delete apiClient.defaults.headers.common["Authorization"]
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  isAuthenticated() {
    return !!this.getToken()
  }
}

export const authService = new AuthService()

// Axios interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await authService.refreshToken()
      if (refreshed) {
        return apiClient(originalRequest)
      }
    }

    return Promise.reject(error)
  },
)