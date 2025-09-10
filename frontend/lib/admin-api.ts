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

  // User Management
  async getUsers(params?: { user_type?: string; page?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.user_type) queryParams.append("user_type", params.user_type)
    if (params?.page) queryParams.append("page", params.page.toString())

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

  // Package Management
  async getPackages(params?: { status?: string; sender?: string; page?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append("status", params.status)
    if (params?.sender) queryParams.append("sender", params.sender)
    if (params?.page) queryParams.append("page", params.page.toString())

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
}

export const adminAPI = new AdminAPIService()
