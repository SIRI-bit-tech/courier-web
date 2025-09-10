"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Badge } from "@/frontend/components/ui/badge"
import { Input } from "@/frontend/components/ui/input"
import { adminApi } from "@/lib/admin-api"

interface Route {
  id: number
  driver: {
    first_name: string
    last_name: string
    email: string
  }
  start_location: string
  end_location: string
  status: string
  created_at: string
  estimated_duration: number
  packages_count: number
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      const response = await adminApi.get("/routes/")
      setRoutes(response.data.results || response.data)
    } catch (error) {
      console.error("Failed to fetch routes:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateRouteStatus = async (routeId: number, newStatus: string) => {
    try {
      await adminApi.patch(`/routes/${routeId}/`, { status: newStatus })
      fetchRoutes()
    } catch (error) {
      console.error("Failed to update route status:", error)
    }
  }

  const filteredRoutes = routes.filter(
    (route) =>
      route.driver.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.driver.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.start_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.end_location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return <div>Loading routes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Routes</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div key={route.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {route.driver.first_name} {route.driver.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {route.start_location} → {route.end_location}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(route.status)}>{route.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(route.created_at).toLocaleDateString()} | Duration: {route.estimated_duration}min
                    | Packages: {route.packages_count}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={route.status}
                    onChange={(e) => updateRouteStatus(route.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
