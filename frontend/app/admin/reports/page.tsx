"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Button } from "@/frontend/components/ui/button"
import { Badge } from "@/frontend/components/ui/badge"
import { adminApi } from "@/lib/admin-api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ReportData {
  packageStats: {
    total: number
    delivered: number
    in_transit: number
    pending: number
  }
  routeStats: {
    total_routes: number
    active_routes: number
    completed_routes: number
  }
  userStats: {
    total_users: number
    active_drivers: number
    customers: number
  }
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7days")

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      const [packagesRes, routesRes, usersRes] = await Promise.all([
        adminApi.get("/packages/"),
        adminApi.get("/routes/statistics/"),
        adminApi.get("/users/"),
      ])

      const packages = packagesRes.data.results || packagesRes.data
      const users = usersRes.data.results || usersRes.data

      const packageStats = {
        total: packages.length,
        delivered: packages.filter((p: any) => p.status === "delivered").length,
        in_transit: packages.filter((p: any) => p.status === "in_transit").length,
        pending: packages.filter((p: any) => p.status === "pending").length,
      }

      const userStats = {
        total_users: users.length,
        active_drivers: users.filter((u: any) => u.user_type === "driver" && u.is_active).length,
        customers: users.filter((u: any) => u.user_type === "customer").length,
      }

      setReportData({
        packageStats,
        routeStats: routesRes.data,
        userStats,
      })
    } catch (error) {
      console.error("Failed to fetch report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const packageChartData = reportData
    ? [
        { name: "Delivered", value: reportData.packageStats.delivered, color: "#10B981" },
        { name: "In Transit", value: reportData.packageStats.in_transit, color: "#F59E0B" },
        { name: "Pending", value: reportData.packageStats.pending, color: "#EF4444" },
      ]
    : []

  const routeChartData = reportData
    ? [
        { name: "Active", value: reportData.routeStats.active_routes },
        { name: "Completed", value: reportData.routeStats.completed_routes },
      ]
    : []

  if (loading) {
    return <div>Loading reports...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
        <div className="flex items-center space-x-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="border rounded px-3 py-2">
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <Button onClick={fetchReportData}>Refresh</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData?.packageStats.total}</div>
            <div className="text-sm text-gray-500 mt-2">
              <Badge variant="default" className="mr-2">
                {reportData?.packageStats.delivered} Delivered
              </Badge>
              <Badge variant="secondary">{reportData?.packageStats.in_transit} In Transit</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData?.routeStats.active_routes}</div>
            <div className="text-sm text-gray-500 mt-2">{reportData?.routeStats.total_routes} Total Routes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData?.userStats.total_users}</div>
            <div className="text-sm text-gray-500 mt-2">
              <Badge variant="default" className="mr-2">
                {reportData?.userStats.active_drivers} Drivers
              </Badge>
              <Badge variant="secondary">{reportData?.userStats.customers} Customers</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Package Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={packageChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {packageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
