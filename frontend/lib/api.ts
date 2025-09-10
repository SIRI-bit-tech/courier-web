import axios from "axios"
import { authService } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await authService.refreshToken()
      if (refreshed) {
        const token = authService.getToken()
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  },
)

// API endpoints
export const packageAPI = {
  track: (trackingNumber: string) => api.get(`/api/packages/${trackingNumber}/track/`),
  calculateRate: (data: any) => api.post("/api/packages/calculate-rate/", data),
  create: (data: any) => api.post("/api/packages/", data),
  list: (params?: any) => api.get("/api/packages/", { params }),
  update: (id: number, data: any) => api.patch(`/api/packages/${id}/`, data),
}

export const routeAPI = {
  list: () => api.get("/api/routes/"),
  create: (data: any) => api.post("/api/routes/", data),
  update: (id: number, data: any) => api.patch(`/api/routes/${id}/`, data),
  optimize: (routeId: number) => api.post(`/api/routes/${routeId}/optimize/`),
}

export const notificationAPI = {
  list: () => api.get("/api/notifications/"),
  markAsRead: (id: number) => api.patch(`/api/notifications/${id}/`, { is_read: true }),
}

export const userAPI = {
  profile: () => api.get("/api/accounts/profile/"),
  updateProfile: (data: any) => api.patch("/api/accounts/profile/", data),
  drivers: () => api.get("/api/accounts/drivers/"),
}
