import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { authService } from "./auth"
import { rateLimiter, sanitizeInput, SecureStorage } from "./security"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
const secureStorage = SecureStorage.getInstance()

// Create axios instance with enhanced security
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for production
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: false, // Disable cookies for security
})

// CSRF token management
let csrfToken: string | null = null

const getCSRFToken = (): string => {
  if (typeof window === 'undefined') return ''

  if (!csrfToken) {
    csrfToken = secureStorage.getItem('csrf_token')
    if (!csrfToken) {
      csrfToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
      secureStorage.setItem('csrf_token', csrfToken)
    }
  }

  return csrfToken
}

// Request interceptor with enhanced security
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authorization header
    const token = authService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      config.headers['X-CSRFToken'] = getCSRFToken()
    }

    // Sanitize request data
    if (config.data && typeof config.data === 'object') {
      config.data = sanitizeRequestData(config.data)
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId()

    // Rate limiting check
    const endpoint = config.url || ''
    if (!rateLimiter.checkLimit(endpoint, 100, 60000)) { // 100 requests per minute
      return Promise.reject(new Error('Rate limit exceeded'))
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor with enhanced security
api.interceptors.response.use(
  (response) => {
    // Validate response data
    if (response.data) {
      response.data = validateResponseData(response.data)
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await authService.refreshToken()
      if (refreshed) {
        const token = authService.getToken()
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api(originalRequest)
      }

      // Token refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      // Could implement exponential backoff here
    }

    return Promise.reject(error)
  }
)

// Utility functions
const sanitizeRequestData = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeInput(data)
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeRequestData(item))
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value)
      } else {
        sanitized[key] = sanitizeRequestData(value)
      }
    }
    return sanitized
  }

  return data
}

const validateResponseData = (data: any): any => {
  // Basic validation - in production, you might want more sophisticated validation
  if (typeof data === 'object' && data !== null) {
    // Remove any potentially dangerous properties
    const validated: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        validated[key] = value
      }
    }
    return validated
  }
  return data
}

const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Enhanced API endpoints with security
export const packageAPI = {
  track: (trackingNumber: string) => {
    const sanitizedTracking = sanitizeInput(trackingNumber)
    return api.get(`/api/packages/${sanitizedTracking}/track/`)
  },

  calculateRate: (data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.post("/api/packages/calculate-rate/", sanitizedData)
  },

  create: (data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.post("/api/packages/", sanitizedData)
  },

  list: (params?: any) => {
    const sanitizedParams = params ? sanitizeRequestData(params) : undefined
    return api.get("/api/packages/", { params: sanitizedParams })
  },

  update: (id: number, data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.patch(`/api/packages/${id}/`, sanitizedData)
  },
}

export const routeAPI = {
  list: () => api.get("/api/routes/"),

  create: (data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.post("/api/routes/", sanitizedData)
  },

  update: (id: number, data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.patch(`/api/routes/${id}/`, sanitizedData)
  },

  optimize: (routeId: number) => api.post(`/api/routes/${routeId}/optimize/`),
}

export const notificationAPI = {
  list: () => api.get("/api/notifications/"),

  markAsRead: (id: number) => api.patch(`/api/notifications/${id}/`, { is_read: true }),
}

export const userAPI = {
  profile: () => api.get("/api/accounts/profile/"),

  updateProfile: (data: any) => {
    const sanitizedData = sanitizeRequestData(data)
    return api.patch("/api/accounts/profile/", sanitizedData)
  },

  drivers: () => api.get("/api/accounts/drivers/"),
}

// Security monitoring
export const securityMonitor = {
  logFailedLogin: (username: string) => {
    // Silent logging
  },

  logSuspiciousActivity: (activity: string, details: any) => {
    // Silent logging
  },

  logRateLimitHit: (endpoint: string) => {
    // Silent logging
  },
}