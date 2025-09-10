"use client"

import { useAuth } from "@/contexts/AuthContext"
import { CustomerDashboard } from "@/components/dashboards/CustomerDashboard"
import { DriverDashboard } from "@/components/dashboards/DriverDashboard"
import { AdminDashboard } from "@/components/dashboards/AdminDashboard"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  switch (user.user_type) {
    case "customer":
      return <CustomerDashboard />
    case "driver":
      return <DriverDashboard />
    case "admin":
      return <AdminDashboard />
    default:
      return <CustomerDashboard />
  }
}