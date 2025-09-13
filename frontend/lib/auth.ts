import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios"

// ✅ Works for both development and production
const API_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' && window.location.protocol === 'https:' 
    ? `https://${window.location.host.replace(':3000', ':8000')}`  // Production with SSL
    : "http://localhost:8000"  // Development fallback
)
const isDevelopment = process.env.NODE_ENV === 'development'

// ✅ PRODUCTION-READY: Enhanced axios configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false, // Important for production
})

// ✅ PRODUCTION-READY: Request interceptor for security
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add timestamp for cache busting in production
    if (config.method?.toUpperCase() === 'GET') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

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
  // Sender information (required by backend)
  sender_name: string
  sender_phone: string
  sender_address: string
  sender_city: string
  sender_state: string
  sender_zip: string

  // Package details
  weight: number
  length: number
  width: number
  height: number
  package_type: string
  description: string

  // Receiver details (corrected field names)
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_city: string
  recipient_state: string
  recipient_zip: string
}

class AuthService {
  private tokenKey = "swiftcourier_token"
  private refreshTokenKey = "swiftcourier_refresh_token"
  private userKey = "swiftcourier_user"
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  // ✅ PRODUCTION-READY: Clean login without console.logs
  async login(credentials: LoginCredentials) {
    try {
      const response = await apiClient.post('/api/auth/token/', credentials)
      const { access, refresh, user } = response.data

      if (!access || !refresh) {
        throw new Error('Invalid token response')
      }

      // Store tokens securely
      this.setTokens(access, refresh)
      if (user) {
        localStorage.setItem(this.userKey, JSON.stringify(user))
      }

      // Set authorization header
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`

      return { 
        success: true, 
        tokens: { access, refresh },
        user: user 
      }
    } catch (error: any) {
      // Log errors only in development
      if (isDevelopment) {
        console.error('Login failed:', error.response?.data || error.message)
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.non_field_errors?.[0] || 
               "Login failed. Please check your credentials.",
      }
    }
  }

  // ✅ PRODUCTION-READY: Clean registration
  async register(data: RegisterData) {
    try {
      const response = await apiClient.post('/api/accounts/register/', data)
      
      return { 
        success: true, 
        user: response.data,
        message: response.data?.message || "Registration successful!"
      }
    } catch (error: any) {
      // Log errors only in development
      if (isDevelopment) {
        console.error('Registration failed:', error.response?.data)
      }
      
      // Handle field-specific errors
      if (error.response?.data) {
        const errors = error.response.data
        
        // Handle password mismatch
        if (errors.password_confirm) {
          return {
            success: false,
            error: "Passwords do not match.",
            field_errors: errors
          }
        }
        
        // Handle username/email already exists
        if (errors.username || errors.email) {
          return {
            success: false,
            error: errors.username?.[0] || errors.email?.[0] || "Username or email already exists.",
            field_errors: errors
          }
        }
        
        // Handle general errors
        if (errors.detail) {
          return {
            success: false,
            error: errors.detail,
            field_errors: errors
          }
        }
      }
      
      return {
        success: false,
        error: "Registration failed. Please try again.",
      }
    }
  }

  // ✅ PRODUCTION-READY: Clean user profile fetching
  async getCurrentUser(): Promise<User | null> {
    // Ensure we have a valid token before making the request
    await this.ensureValidToken()
    
    const token = this.getToken()
    if (!token) {
      return null
    }

    // Try to get from localStorage first
    const cachedUser = localStorage.getItem(this.userKey)
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser)
      } catch (e) {
        if (isDevelopment) {
          console.warn('Invalid cached user data')
        }
      }
    }

    try {
      const response = await apiClient.get('/api/accounts/profile/', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // Shorter timeout for profile requests
      })
      
      const user = response.data
      
      // Cache user data
      localStorage.setItem(this.userKey, JSON.stringify(user))
      
      return user
    } catch (error: any) {
      // Log errors only in development
      if (isDevelopment) {
        console.error('Failed to fetch user profile:', error.response?.data || error.message)
      }
      
      // If unauthorized, clear tokens
      if (error.response?.status === 401) {
      this.logout()
      }
      
      return null
    }
  }

  // ✅ PRODUCTION-READY: Clean profile update
  async updateProfile(profileData: Partial<User>) {
    const token = this.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await apiClient.patch('/api/accounts/profile/', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const updatedUser = response.data
      
      // Update cached user data
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser))
      
      return { success: true, user: updatedUser }
    } catch (error: any) {
      // Log errors only in development
      if (isDevelopment) {
        console.error('Profile update failed:', error.response?.data)
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               "Profile update failed. Please try again.",
        field_errors: error.response?.data
      }
    }
  }

  // ✅ PRODUCTION-READY: Enhanced createPackage with better error handling
  async createPackage(packageData: CreatePackageData) {
    const token = this.getToken()
    if (!token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await apiClient.post('/api/packages/', packageData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      return { success: true, package: response.data }
    } catch (error: any) {
      // Enhanced error logging
      if (isDevelopment) {
        console.error('Package creation error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          fullError: error
        })
      }
      
      // Handle validation errors properly
      if (error.response?.status === 400) {
        const validationErrors = error.response.data
        
        // Debug: Log the raw validation errors to understand the format
        console.log('Raw validation errors:', validationErrors)
        
        // Convert Django REST framework validation errors to readable format
        let errorMessage = "Please check the following fields:"
        const errorMessages = []
        
        if (typeof validationErrors === 'object' && validationErrors !== null) {
          // Handle Django REST framework field errors (arrays of strings)
          for (const [field, errors] of Object.entries(validationErrors)) {
            if (Array.isArray(errors) && errors.length > 0) {
              // Check if errors contain field names instead of messages
              const hasFieldNames = errors.some(error => 
                typeof error === 'string' && 
                (error.includes('sender_') || error.includes('recipient_'))
              )
              
              if (hasFieldNames) {
                // This is likely a Django model validation issue
                // Provide generic field-specific messages
                switch(field) {
                  case 'sender_name':
                    errorMessages.push("Sender name is required")
                    break
                  case 'sender_phone':
                    errorMessages.push("Sender phone number is required")
                    break
                  case 'sender_address':
                  case 'sender_city':
                  case 'sender_state':
                  case 'sender_zip':
                    errorMessages.push("Complete sender address information is required")
                    break
                  case 'recipient_name':
                    errorMessages.push("Recipient name is required")
                    break
                  case 'recipient_phone':
                    errorMessages.push("Recipient phone number is required")
                    break
                  case 'recipient_address':
                  case 'recipient_city':
                  case 'recipient_state':
                  case 'recipient_zip':
                    errorMessages.push("Complete recipient address information is required")
                    break
                  case 'weight':
                    errorMessages.push("Package weight is required and must be greater than 0")
                    break
                  case 'package_type':
                    errorMessages.push("Package type is required")
                    break
                  default:
                    errorMessages.push(`${field}: This field is required`)
                }
              } else {
                // Normal validation errors
                const fieldErrorMessage = errors.join(", ")
                errorMessages.push(`${field}: ${fieldErrorMessage}`)
              }
            } else if (typeof errors === 'string') {
              errorMessages.push(`${field}: ${errors}`)
            }
          }
          
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join("\n")
          } else {
            // Fallback for non-field errors
            errorMessage = validationErrors.detail || 
                          validationErrors.message || 
                          "Invalid data provided. Please check all fields."
          }
        }
        
        return {
          success: false,
          error: errorMessage,
          field_errors: validationErrors
        }
      }
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Authentication failed. Please log in again.",
          field_errors: null
        }
      }
      
      // Handle permission errors
      if (error.response?.status === 403) {
        return {
          success: false,
          error: "You don't have permission to create packages.",
          field_errors: null
        }
      }
      
      // Handle server errors
      if (error.response?.status >= 500) {
        return {
          success: false,
          error: "Server error. Please try again later.",
          field_errors: null
        }
      }
      
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: "Network error. Please check your internet connection.",
          field_errors: null
        }
      }
      
      // Fallback error handling
      const fallbackError = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.message || 
                           "Package creation failed. Please try again."
      
      return {
        success: false,
        error: typeof fallbackError === 'string' ? fallbackError : "Package creation failed. Please try again.",
        field_errors: error.response?.data
      }
    }
  }

  // ✅ PRODUCTION-READY: Clean package tracking
  async trackPackage(trackingNumber: string) {
    try {
      const response = await apiClient.get(`/api/packages/${trackingNumber}/track/`)
      
      return { success: true, package: response.data }
    } catch (error: any) {
      // Log errors only in development
      if (isDevelopment) {
        console.error('Package tracking failed:', error.response?.data)
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               "Package tracking failed. Please check the tracking number.",
      }
    }
  }

  // ✅ PRODUCTION-READY: Clean token refresh with minimal logging
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey)
    
    if (!refreshToken) {
      return false
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise
    }

    this.isRefreshing = true
    
    try {
      this.refreshPromise = this._performTokenRefresh(refreshToken)
      const result = await this.refreshPromise
      
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async _performTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/api/auth/token/refresh/', {
        refresh: refreshToken,
      }, {
        timeout: 10000, // Shorter timeout for token refresh
      })

      const { access } = response.data
      
      if (!access) {
        throw new Error('No access token in refresh response')
      }

      // Update stored tokens
      localStorage.setItem(this.tokenKey, access)
      
      // Update authorization header
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${access}`

      return true
    } catch (error: any) {
      // Log refresh failures only in development
      if (isDevelopment) {
        console.error('Token refresh failed:', error.response?.data || error.message)
      }
      
      // If refresh token is invalid, logout
      if (error.response?.status === 401) {
      this.logout()
      }
      
      return false
    }
  }

  // ✅ PRODUCTION-READY: Clean logout
  logout() {
    // Clear all stored data
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
    
    // Clear authorization header
    delete apiClient.defaults.headers.common["Authorization"]
  }

  // ✅ PRODUCTION-READY: Token management
  private setTokens(access: string, refresh: string) {
    localStorage.setItem(this.tokenKey, access)
    localStorage.setItem(this.refreshTokenKey, refresh)
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey)
  }

  // ✅ PRODUCTION-READY: Clean authentication check
  isAuthenticated(): boolean {
    const token = this.getToken()
    const refreshToken = this.getRefreshToken()
    
    if (!token || !refreshToken) {
      return false
    }

    try {
      // Basic JWT validation (check if not expired)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      return payload.exp > currentTime
    } catch (error) {
      // Log invalid token only in development
      if (isDevelopment) {
        console.warn('Invalid token format')
      }
      return false
    }
  }

  // ✅ PRODUCTION-READY: Check if token needs refresh
  shouldRefreshToken(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // Refresh if token expires in less than 5 minutes
      return (payload.exp - currentTime) < 300
    } catch (error) {
      // Log token expiry check errors only in development
      if (isDevelopment) {
        console.warn('Error checking token expiry')
      }
      return false
    }
  }

  // Add this method to ensure token is properly updated
  private async ensureValidToken(): Promise<void> {
    if (this.shouldRefreshToken()) {
      await this.refreshToken()
      // Small delay to ensure token is updated
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

export const authService = new AuthService()

// ✅ PRODUCTION-READY: Clean axios interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests only in development
    if (isDevelopment && response.config.method?.toUpperCase() !== 'GET') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`)
    }
    return response
  },
  async (error: any) => {
    const originalRequest = error.config

    // Log errors only in development
    if (isDevelopment) {
      console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status || 'Network Error'}`)
    }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await authService.refreshToken()
      if (refreshed) {
        const token = authService.getToken()
        if (originalRequest.headers && token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        
        return apiClient(originalRequest)
      } else {
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.'
      })
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      return Promise.reject({
        ...error,
        message: 'Server error. Please try again later.'
      })
    }

    return Promise.reject(error)
  }
)

// ✅ PRODUCTION-READY: Auto-refresh tokens before expiry (silent operation)
if (typeof window !== 'undefined') {
  // Check every minute for token refresh needs (no logging)
  setInterval(() => {
    if (authService.shouldRefreshToken()) {
      authService.refreshToken()
    }
  }, 60000) // Check every minute
}