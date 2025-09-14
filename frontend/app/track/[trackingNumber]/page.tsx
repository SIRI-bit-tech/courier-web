"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, MapPin, Clock, CheckCircle, Truck, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { OpenStreetMap } from "@/components/OpenStreetMap"
import { RealTimeNotifications } from "@/components/RealTimeNotifications"
import { packageAPI } from "@/lib/api"
import { wsManager } from "@/lib/websocket"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

interface TrackingEvent {
  id: number
  status: string
  description: string
  location: string
  timestamp: string
}

interface PackageData {
  tracking_number: string
  status: string
  recipient_name: string
  recipient_address: string
  current_location: string
  latitude?: number
  longitude?: number
  estimated_delivery: string
  tracking_events: TrackingEvent[]
  last_updated: string
}

export default function TrackingPage({ params }: { params: { trackingNumber: string } }) {
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const connectWebSocket = () => {
      wsManager.connect(`/ws/tracking/${params.trackingNumber}/`)

      wsManager.on("connected", () => {
        setIsConnected(true)
      })

      wsManager.on("disconnected", () => {
        setIsConnected(false)
      })

      wsManager.on("package_status", (data: any) => {
        setPackageData(data.data)
        setLastUpdate(new Date())
      })

      wsManager.on("package_update", (data: any) => {
        setPackageData((prevData) => {
          if (!prevData) return data.data
          return {
            ...prevData,
            ...data.data,
            tracking_events: data.data.tracking_events || prevData.tracking_events,
          }
        })
        setLastUpdate(new Date())
      })

      wsManager.on("error", (error: any) => {
        setIsConnected(false)
      })
    }

    connectWebSocket()

    return () => {
      wsManager.disconnect()
    }
  }, [params.trackingNumber])

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const response = await packageAPI.track(params.trackingNumber)
        setPackageData(response.data)
        setLastUpdate(new Date())
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError("Package not found")
        } else {
          setError("Failed to fetch package data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPackageData()
  }, [params.trackingNumber])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "in_transit":
      case "out_for_delivery":
        return <Truck className="h-6 w-6 text-primary" />
      case "on_hold":
        return <Clock className="h-6 w-6 text-yellow-500" />
      case "failed_delivery":
        return <AlertCircle className="h-6 w-6 text-destructive" />
      default:
        return <Package className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-500"
      case "in_transit":
      case "out_for_delivery":
        return "text-primary"
      case "on_hold":
        return "text-yellow-500"
      case "failed_delivery":
        return "text-destructive"
      default:
        return "text-gray-600"
    }
  }

  // Helper function to determine step status
  const getStepStatus = (step: string, currentStatus?: string): 'completed' | 'current' | 'pending' => {
    if (!currentStatus) return 'pending'
    
    const statusOrder = ['created', 'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const stepIndex = statusOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-lg text-gray-600">Loading package information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-destructive">Package Not Found</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <RealTimeNotifications trackingNumber={params.trackingNumber} />

        {/* Navigation */}
        <nav className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200">
                    <Wifi className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Package Header */}
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-heading">Tracking: {packageData?.tracking_number}</CardTitle>
                    <CardDescription className="text-lg mt-2">To: {packageData?.recipient_name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(packageData?.status || "")}
                      <span className={`font-semibold capitalize ${getStatusColor(packageData?.status || "")}`}>
                        {packageData?.status?.replace("_", " ")}
                      </span>
                    </div>
                    {packageData?.estimated_delivery && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Est. Delivery: {new Date(packageData.estimated_delivery).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {lastUpdate && (
                      <div className="text-xs text-gray-600 mt-1">Last updated: {lastUpdate.toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-primary">Delivery Address</h3>
                    <p className="text-gray-600 text-pretty">{packageData?.recipient_address}</p>
                  </div>
                  {packageData?.current_location && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                        <MapPin className="h-4 w-4" />
                        Current Location
                      </h3>
                      <p className="text-gray-600">{packageData.current_location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {packageData?.latitude && packageData?.longitude && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2 text-primary">
                      <MapPin className="h-5 w-5" />
                      Live Location
                    </CardTitle>
                    <CardDescription>Real-time package location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OpenStreetMap
                      center={{
                        lat: packageData.latitude,
                        lng: packageData.longitude,
                      }}
                      zoom={13}
                      markers={[
                        {
                          position: {
                            lat: packageData.latitude,
                            lng: packageData.longitude,
                          },
                          title: `Package ${packageData.tracking_number}`,
                          info: packageData.current_location || 'Current Location',
                        },
                      ]}
                      className="h-64 w-full rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Tracking Timeline */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="font-heading text-primary">Track History</CardTitle>
                  <CardDescription>Follow your package from creation to delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Current Status Highlight */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-6 bg-primary/10 rounded-xl border-2 border-primary/20"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          {getStatusIcon(packageData?.status || "")}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-primary capitalize">
                            Current Status: {packageData?.status?.replace("_", " ")}
                          </h3>
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            {new Date().toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-lg">
                          {packageData?.status === 'delivered' && '🎉 Package successfully delivered!'}
                          {packageData?.status === 'in_transit' && '🚚 Package is on the way to you'}
                          {packageData?.status === 'out_for_delivery' && '🚛 Package is out for delivery to your address'}
                          {packageData?.status === 'picked_up' && '✅ Package has been picked up by our courier'}
                          {packageData?.status === 'pending' && '⏳ Package is ready for pickup at the origin'}
                          {packageData?.status === 'on_hold' && '⏸️ Package is currently on hold'}
                          {packageData?.status === 'failed_delivery' && '❌ Delivery attempt failed - will retry'}
                          {packageData?.status === 'cancelled' && '🚫 Package delivery cancelled'}
                        </p>
                        {packageData?.current_location && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <strong>Current Location:</strong> {packageData.current_location}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Historical Events Timeline */}
                    {packageData?.tracking_events && packageData.tracking_events.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-12"
                      >
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 Detailed Event History</h4>
                        <div className="space-y-4">
                          {packageData.tracking_events
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                            .map((event, index) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="flex gap-4 p-4 bg-gray-50 rounded-lg border"
                              >
                                <div className="flex flex-col items-center">
                                  {getStatusIcon(event.status)}
                                  {index < packageData.tracking_events.length - 1 && (
                                    <div className="w-px h-8 bg-gray-300 mt-2" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold capitalize text-gray-800">
                                      {event.status.replace("_", " ")}
                                    </h5>
                                    <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                                      {new Date(event.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{event.description}</p>
                                  {event.location && (
                                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}