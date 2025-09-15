"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Truck, MapPin, Clock, Package, CheckCircle, RouteIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { routeAPI } from "@/lib/api"
import { wsManager } from "@/lib/websocket"
import { useAuth } from "@/contexts/AuthContext"

interface RouteStop {
  id: number
  package: {
    tracking_number: string
    recipient_name: string
    recipient_address: string
  }
  stop_order: number
  status: string
  estimated_arrival: string
}

interface DeliveryRoute {
  id: number
  route_date: string
  status: string
  total_packages: number
  stops: RouteStop[]
}

export function DriverDashboard() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [loading, setLoading] = useState(true) // Component loading state
  const { user, loading: authLoading } = useAuth() 

  useEffect(() => {
    if (!authLoading && user?.user_type === 'driver') {
      fetchRoutes()
      setupWebSocketConnection()
    } else if (!authLoading) {
      setLoading(false)
    }

    return () => {
      if (user?.user_type === 'driver') {
        wsManager.disconnect()
      }
    }
  }, [user, authLoading])

  const fetchRoutes = async () => {
    try {
      const response = await routeAPI.list()
      setRoutes(response.data.results || response.data)
    } catch (error) {
      console.error("Failed to fetch routes:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    if (!user || user.user_type !== 'driver') {
      console.log('[WS] Skipping driver WebSocket - user is not a driver')
      return
    }

    wsManager.on("route_update", (data: any) => {
      setRoutes((prev) => {
        if (!Array.isArray(prev)) return []
        return prev.map((route) => (route.id === data.route_id ? { ...route, ...data } : route))
      })
    })

    wsManager.on("stop_update", (data: any) => {
      setRoutes((prev) => {
        if (!Array.isArray(prev)) return []
        return prev.map((route) => ({
          ...route,
          stops: Array.isArray(route.stops) 
            ? route.stops.map((stop) => (stop.id === data.stop_id ? { ...stop, status: data.status } : stop))
            : []
        }))
      })
    })

    wsManager.on("new_route", (data: any) => {
      setRoutes((prev) => {
        if (!Array.isArray(prev)) return [data]
        return [data, ...prev]
      })
    })

    wsManager.on("route_removed", (data: any) => {
      setRoutes((prev) => {
        if (!Array.isArray(prev)) return []
        return prev.filter((route) => route.id !== data.route_id)
      })
    })

    wsManager.connect("/ws/driver-updates/")
  }

  const updateStopStatus = async (routeId: number, stopId: number, status: string) => {
    try {
      await routeAPI.update(routeId, {
        stop_id: stopId,
        status,
      })
      fetchRoutes() // Refresh data
    } catch (error) {
      console.error("Failed to update stop status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Safe array operations with error handling
  const todayRoutes = Array.isArray(routes) 
    ? routes.filter((route) => {
        try {
          return new Date(route.route_date).toDateString() === new Date().toDateString()
        } catch (error) {
          console.error("Error filtering route date:", error)
          return false
        }
      })
    : []

  const totalPackages = Array.isArray(todayRoutes) 
    ? todayRoutes.reduce((sum, route) => sum + (route.total_packages || 0), 0)
    : 0

  const completedStops = Array.isArray(todayRoutes)
    ? todayRoutes.reduce((sum, route) => {
        if (!Array.isArray(route.stops)) return sum
        return sum + route.stops.filter(stop => stop.status === "completed").length
      }, 0)
    : 0

  const pendingStops = Array.isArray(todayRoutes)
    ? todayRoutes.reduce((sum, route) => {
        if (!Array.isArray(route.stops)) return sum
        return sum + route.stops.filter(stop => stop.status === "pending").length
      }, 0)
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Driver Dashboard</h1>
          <p className="text-gray-600">Manage your delivery routes and packages</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Routes</p>
                  <p className="text-2xl font-bold">{todayRoutes.length}</p>
                </div>
                <RouteIcon className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Packages</p>
                  <p className="text-2xl font-bold">
                    {totalPackages}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">
                    {completedStops}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">
                    {pendingStops}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Today's Routes</CardTitle>
            <CardDescription>Your delivery schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading routes...</p>
              </div>
            ) : todayRoutes.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600">No routes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-6">
                {todayRoutes.map((route, routeIndex) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: routeIndex * 0.1 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Route #{route.id}</h3>
                        <p className="text-sm text-gray-600">{route.total_packages} packages</p>
                      </div>
                      <Badge className={getStatusColor(route.status)}>{route.status.replace("_", " ")}</Badge>
                    </div>

                    <div className="space-y-3">
                      {route.stops.map((stop, stopIndex) => (
                        <div key={stop.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-accent text-accent-foreground rounded-full text-sm font-semibold">
                              {stop.stop_order}
                            </div>
                            <div>
                              <p className="font-medium">{stop.package.tracking_number}</p>
                              <p className="text-sm text-gray-600">{stop.package.recipient_name}</p>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {stop.package.recipient_address}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(stop.status)}>{stop.status}</Badge>
                            {stop.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStopStatus(route.id, stop.id, "completed")}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStopStatus(route.id, stop.id, "failed")}
                                >
                                  Failed
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}