"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Users, Truck, DollarSign, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { adminAPI } from "@/lib/admin-api"
import { wsManager } from "@/lib/websocket"
import Link from "next/link"

interface DashboardStats {
  total_packages: number
  total_users: number
  active_drivers: number
  total_revenue: number
  packages_today: number
  deliveries_completed: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_packages: 0,
    total_users: 0,
    active_drivers: 0,
    total_revenue: 0,
    packages_today: 0,
    deliveries_completed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    setupWebSocketConnection()

    return () => {
      wsManager.disconnect()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const [packagesRes, usersRes] = await Promise.all([
        adminAPI.getPackages(), 
        adminAPI.getUsers()
      ])

      const packages = packagesRes.data.results || packagesRes.data
      const users = usersRes.data.results || usersRes.data

      const drivers = users.filter((user: any) => user.user_type === "driver")
      const activeDrivers = drivers.filter((driver: any) => driver.is_active)

      setStats({
        total_packages: packages.length,
        total_users: users.length,
        active_drivers: activeDrivers.length,
        total_revenue: packages.reduce((sum: number, pkg: any) => sum + Number.parseFloat(pkg.shipping_cost || 0), 0),
        packages_today: packages.filter(
          (pkg: any) => new Date(pkg.created_at).toDateString() === new Date().toDateString(),
        ).length,
        deliveries_completed: packages.filter((pkg: any) => pkg.status === "delivered").length,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    wsManager.connect("/ws/admin-updates/")

    wsManager.on("stats_update", (data: any) => {
      console.log("[v0] Received stats update:", data)
      setStats((prev) => ({ ...prev, ...data }))
    })

    wsManager.on("system_alert", (data: any) => {
      console.log("[v0] System alert:", data)
      // Handle system alerts/notifications
    })
  }

  const statCards = [
    {
      title: "Total Packages",
      value: stats.total_packages,
      icon: Package,
      color: "text-blue-500",
      change: "+12%",
    },
    {
      title: "Total Users",
      value: stats.total_users,
      icon: Users,
      color: "text-green-500",
      change: "+8%",
    },
    {
      title: "Active Drivers",
      value: stats.active_drivers,
      icon: Truck,
      color: "text-purple-500",
      change: "+3%",
    },
    {
      title: "Total Revenue",
      value: `$${stats.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-yellow-500",
      change: "+15%",
    },
    {
      title: "Packages Today",
      value: stats.packages_today,
      icon: Activity,
      color: "text-red-500",
      change: "+5%",
    },
    {
      title: "Completed Deliveries",
      value: stats.deliveries_completed,
      icon: TrendingUp,
      color: "text-indigo-500",
      change: "+18%",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/packages"
                  className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left block"
                >
                  <Package className="h-6 w-6 text-accent mb-2" />
                  <p className="font-medium">Manage Packages</p>
                  <p className="text-xs text-gray-600">View and update package status</p>
                </Link>
                <Link
                  href="/admin/users"
                  className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left block"
                >
                  <Users className="h-6 w-6 text-accent mb-2" />
                  <p className="font-medium">Manage Users</p>
                  <p className="text-xs text-gray-600">Add, edit, or remove users</p>
                </Link>
                <Link
                  href="/admin/routes"
                  className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left block"
                >
                  <Truck className="h-6 w-6 text-accent mb-2" />
                  <p className="font-medium">Route Management</p>
                  <p className="text-xs text-gray-600">Manage delivery routes</p>
                </Link>
                <Link
                  href="/admin/reports"
                  className="p-4 border rounded-lg hover:bg-accent/10 transition-colors text-left block"
                >
                  <Activity className="h-6 w-6 text-accent mb-2" />
                  <p className="font-medium">System Reports</p>
                  <p className="text-xs text-gray-600">Generate performance reports</p>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <Package className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New package created</p>
                        <p className="text-xs text-gray-600">SC12345678 - 2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <Truck className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Package delivered</p>
                        <p className="text-xs text-gray-600">SC87654321 - 15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                      <Users className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New driver registered</p>
                        <p className="text-xs text-gray-600">John Smith - 1 hour ago</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}