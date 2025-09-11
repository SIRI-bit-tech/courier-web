"use client"

import { Suspense, useEffect } from "react"
import { AdminDashboard } from "@/components/dashboards/AdminDashboard"

export default function AdminDashboardPage() {
  // Add redirect to new login URL if not authenticated
  // This will be handled by the layout, but just in case:
  useEffect(() => {
    const token = localStorage.getItem("admin_access_token")
    if (!token) {
      window.location.href = "/admin-login"
    }
  }, [])

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  )
}