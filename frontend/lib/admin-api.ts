const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class AdminAPIService {
  private getAuthHeaders() {
    const token = localStorage.getItem("admin_access_token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Admin token expired, redirect to admin login
        localStorage.removeItem("admin_access_token")
        localStorage.removeItem("admin_refresh_token")
        localStorage.removeItem("admin_user")
        window.location.href = "/admin/login"
        throw new Error("Admin session expired")
      }
      const error = await response.json()
      throw new Error(error.message || "API request failed")
    }
    return response.json()
  }

  // Admin Stats
  async getAdminStats() {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/stats/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getPackageStatistics() {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/statistics/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // User Management - ADVANCED VERSION
  async getUsers(params?: {
    user_type?: string
    search?: string
    is_active?: boolean
    date_joined_from?: string
    date_joined_to?: string
    page?: number
    page_size?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.user_type) queryParams.append("user_type", params.user_type)
    if (params?.search) queryParams.append("search", params.search)
    if (params?.is_active !== undefined) queryParams.append("is_active", params.is_active.toString())
    if (params?.date_joined_from) queryParams.append("date_joined_from", params.date_joined_from)
    if (params?.date_joined_to) queryParams.append("date_joined_to", params.date_joined_to)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString())

    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createUser(userData: any) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async updateUser(userId: number, userData: any) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/${userId}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })
    return this.handleResponse(response)
  }

  async deleteUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/${userId}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete user")
    }
  }

  // Bulk User Operations
  async bulkDeleteUsers(userIds: number[]) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/bulk-delete/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ user_ids: userIds }),
    })
    return this.handleResponse(response)
  }

  async bulkUpdateUsers(userIds: number[], updates: any) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/bulk-update/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ user_ids: userIds, updates }),
    })
    return this.handleResponse(response)
  }

  // Package Management - ADVANCED VERSION
  async getPackages(params?: {
    status?: string
    package_type?: string
    sender?: string
    search?: string
    weight_min?: number
    weight_max?: number
    cost_min?: number
    cost_max?: number
    created_from?: string
    created_to?: string
    page?: number
    page_size?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.package_type) queryParams.append("package_type", params.package_type)
    if (params?.sender) queryParams.append("sender", params.sender)
    if (params?.search) queryParams.append("search", params.search)
    if (params?.weight_min) queryParams.append("weight_min", params.weight_min.toString())
    if (params?.weight_max) queryParams.append("weight_max", params.weight_max.toString())
    if (params?.cost_min) queryParams.append("cost_min", params.cost_min.toString())
    if (params?.cost_max) queryParams.append("cost_max", params.cost_max.toString())
    if (params?.created_from) queryParams.append("created_from", params.created_from)
    if (params?.created_to) queryParams.append("created_to", params.created_to)
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString())

    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async generatePackageWithTracking(packageData: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/generate-package/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(packageData),
    })
    return this.handleResponse(response)
  }

  async sendEmailNotification(
    packageId: number,
    emailData: {
      recipient_email: string
      subject: string
      message: string
    },
  ) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/${packageId}/send-email/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(emailData),
    })
    return this.handleResponse(response)
  }

  async createPackage(packageData: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(packageData),
    })
    return this.handleResponse(response)
  }

  async updatePackage(packageId: number, packageData: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/${packageId}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(packageData),
    })
    return this.handleResponse(response)
  }

  async deletePackage(packageId: number) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/${packageId}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete package")
    }
  }

  // Bulk Package Operations
  async bulkDeletePackages(packageIds: number[]) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/bulk-delete/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ package_ids: packageIds }),
    })
    return this.handleResponse(response)
  }

  async bulkUpdatePackages(packageIds: number[], updates: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/bulk-update/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ package_ids: packageIds, updates }),
    })
    return this.handleResponse(response)
  }

  // Export Data
  async exportUsers(format: 'csv' | 'xlsx' | 'json', params?: any) {
    const queryParams = new URLSearchParams({ format })
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/export/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  }

  async exportPackages(format: 'csv' | 'xlsx' | 'json', params?: any) {
    const queryParams = new URLSearchParams({ format })
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/export/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  }

  // File Upload Support
  async uploadFile(file: File, type: 'qr_code' | 'document' | 'image') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch(`${API_BASE_URL}/api/uploads/admin/upload/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_access_token")}`,
      },
      body: formData,
    })
    return this.handleResponse(response)
  }

  // Change History / Audit Logs
  async getUserChangeHistory(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/accounts/admin/users/${userId}/history/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async getPackageChangeHistory(packageId: number) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/packages/${packageId}/history/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Real-time WebSocket Connection
  connectWebSocket(onMessage: (data: any) => void) {
    const token = localStorage.getItem("admin_access_token")
    if (!token) return null

    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/admin/?token=${token}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      onMessage(data)
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return ws
  }

  // Service Area Management
  async getServiceAreas() {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/service-areas/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createServiceArea(areaData: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/service-areas/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(areaData),
    })
    return this.handleResponse(response)
  }

  async updateServiceArea(areaId: number, areaData: any) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/service-areas/${areaId}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(areaData),
    })
    return this.handleResponse(response)
  }

  async deleteServiceArea(areaId: number) {
    const response = await fetch(`${API_BASE_URL}/api/packages/admin/service-areas/${areaId}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete service area")
    }
  }

  // Route Management
  async getRoutes() {
    const response = await fetch(`${API_BASE_URL}/api/routes/admin/routes/`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async createRoute(routeData: any) {
    const response = await fetch(`${API_BASE_URL}/api/routes/admin/routes/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(routeData),
    })
    return this.handleResponse(response)
  }

  async updateRoute(routeId: number, routeData: any) {
    const response = await fetch(`${API_BASE_URL}/api/routes/admin/routes/${routeId}/`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(routeData),
    })
    return this.handleResponse(response)
  }

  async deleteRoute(routeId: number) {
    const response = await fetch(`${API_BASE_URL}/api/routes/admin/routes/${routeId}/`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error("Failed to delete route")
    }
  }

  // Tracking Events
  async getTrackingEvents(params?: {
    package_id?: number
    status?: string
    created_from?: string
    created_to?: string
    page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.package_id) queryParams.append("package_id", params.package_id.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.created_from) queryParams.append("created_from", params.created_from)
    if (params?.created_to) queryParams.append("created_to", params.created_to)
    if (params?.page) queryParams.append("page", params.page.toString())

    const response = await fetch(`${API_BASE_URL}/api/tracking/admin/events/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  // Notifications
  async getNotifications(params?: {
    type?: string
    status?: string
    sent_from?: string
    sent_to?: string
    page?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append("type", params.type)
    if (params?.status) queryParams.append("status", params.status)
    if (params?.sent_from) queryParams.append("sent_from", params.sent_from)
    if (params?.sent_to) queryParams.append("sent_to", params.sent_to)
    if (params?.page) queryParams.append("page", params.page.toString())

    const response = await fetch(`${API_BASE_URL}/api/notifications/admin/notifications/?${queryParams}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse(response)
  }

  async sendBulkNotifications(notificationData: {
    user_ids?: number[]
    package_ids?: number[]
    type: string
    subject: string
    message: string
  }) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/admin/bulk-send/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(notificationData),
    })
    return this.handleResponse(response)
  }
}

export const adminAPI = new AdminAPIService()