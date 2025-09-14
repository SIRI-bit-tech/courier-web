"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { PackageIcon, Plus, Search, Clock, CheckCircle, Truck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import Link from "next/link"
import { packageAPI } from "@/lib/api"
import { wsManager } from "@/lib/websocket"

interface Package {
    id: number
    tracking_number: string
    recipient_name: string
    recipient_address: string
    status: string
    created_at: string
    estimated_delivery: string
    shipping_cost: string
    current_location?: string
    latitude?: number
    longitude?: number
    last_updated?: string
}

export function CustomerDashboard() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
    
    const timer = setTimeout(() => {
      setupWebSocketConnection()
    }, 1000)

    return () => {
      clearTimeout(timer)
      wsManager.disconnect()
    }
  }, [])

  const fetchPackages = async () => {
    try {
      setError(null)
      setLoading(true)
      const response = await packageAPI.list()
      
      let packageData: Package[] = []
      
      if (response?.data) {
        if (Array.isArray(response.data)) {
          packageData = response.data
        } else if (response.data.results && Array.isArray(response.data.results)) {
          packageData = response.data.results
        } else if (typeof response.data === 'object' && response.data !== null) {
          const keys = Object.keys(response.data)
          const numericKeys = keys.filter(key => !isNaN(Number(key)))
          
          if (numericKeys.length > 0) {
            packageData = keys
              .sort((a, b) => Number(a) - Number(b))
              .map(key => response.data[key])
          } else {
            packageData = []
          }
        }
      }
      
      const validPackages = packageData.filter(pkg => 
        pkg && 
        typeof pkg === 'object' && 
        pkg.id && 
        pkg.tracking_number &&
        typeof pkg.tracking_number === 'string'
      )
      
      setPackages(validPackages)
    } catch (error: any) {
      setPackages([])
      setError(error?.response?.data?.detail || error?.message || 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    wsManager.on('connected', () => {
      setConnectionStatus('connected')
    })

    wsManager.on('disconnected', () => {
      setConnectionStatus('disconnected')
    })

    wsManager.on('package_update', (data: any) => {
      setPackages(prevPackages => {
        const updatedPackages = prevPackages.map(pkg => {
          if (pkg.id === data.data?.package_id || pkg.tracking_number === data.data?.tracking_number) {
            return {
              ...pkg,
              ...data.data,
              status: data.data?.status || pkg.status,
              current_location: data.data?.current_location || pkg.current_location,
              latitude: data.data?.latitude || pkg.latitude,
              longitude: data.data?.longitude || pkg.longitude,
              estimated_delivery: data.data?.estimated_delivery || pkg.estimated_delivery,
              last_updated: data.data?.last_updated || pkg.last_updated
            }
          }
          return pkg
        })
        return updatedPackages
      })
    })

    wsManager.on('new_package', (data: any) => {
      setPackages(prevPackages => {
        const newPackage: Package = {
          id: data.data?.package_id,
          tracking_number: data.data?.tracking_number,
          recipient_name: data.data?.recipient_name,
          recipient_address: data.data?.recipient_address,
          status: data.data?.status || 'pending',
          created_at: data.data?.created_at,
          estimated_delivery: data.data?.estimated_delivery,
          shipping_cost: '0.00'
        }
        
        const updatedPackages = [newPackage, ...prevPackages]
        return updatedPackages
      })
    })

    wsManager.connect("/ws/notifications/")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_transit":
        return <Truck className="h-4 w-4 text-blue-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed_delivery":
        return <PackageIcon className="h-4 w-4 text-red-500" />
      default:
        return <PackageIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed_delivery":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPackages = useMemo(() => {
    try {
      if (!Array.isArray(packages)) {
        return []
      }
      
      return packages.filter((pkg) => {
        if (!pkg || typeof pkg !== 'object') return false
        
        try {
          const searchLower = searchTerm.toLowerCase()
          const trackingMatch = pkg.tracking_number?.toLowerCase().includes(searchLower) || false
          const recipientMatch = pkg.recipient_name?.toLowerCase().includes(searchLower) || false
          
          return trackingMatch || recipientMatch
        } catch (filterError) {
          return false
        }
      })
    } catch (error) {
      return []
    }
  }, [packages, searchTerm])

  const getPackageCount = (status?: string) => {
    if (!Array.isArray(packages)) {
      return 0
    }
    
    if (!status) {
      return packages.length
    }
    
    return packages.filter(pkg => pkg && pkg.status === status).length
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your packages...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-500">{error}</p>
            <button 
              onClick={fetchPackages}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your packages and manage shipments
            </p>
          </div>
          <Link href="/ship">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ship Package
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Packages
              </CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPackageCount()}</div>
              <p className="text-xs text-muted-foreground">
                All time shipments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Transit
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getPackageCount('in_transit')}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently moving
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Delivered
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getPackageCount('delivered')}
                </div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Connection Status
              </CardTitle>
              <div className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium capitalize">{connectionStatus}</div>
              <p className="text-xs text-muted-foreground">
                Real-time updates
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
              placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              />
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Packages</CardTitle>
            <CardDescription>
              Track the status of your shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPackages.length === 0 ? (
              <div className="text-center py-8">
                <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No packages found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try adjusting your search terms." : "Get started by shipping your first package."}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                <Link href="/ship">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Ship Your First Package
                      </Button>
                </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPackages.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(pkg.status)}
                      <div>
                        <p className="text-sm font-medium leading-none">
                            {pkg.tracking_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pkg.recipient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pkg.recipient_address}
                        </p>
                        </div>
                      </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusBadgeColor(pkg.status)}>
                        {pkg.status.replace('_', ' ')}
                      </Badge>
                        <Link href={`/track/${pkg.tracking_number}`}>
                          <Button variant="outline" size="sm">
                            Track
                          </Button>
                        </Link>
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