"use client"

import { useState, useEffect } from "react"
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
}

export function CustomerDashboard() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPackages()
    setupWebSocketConnection()

    return () => {
      wsManager.disconnect()
    }
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await packageAPI.list()
      setPackages(response.data.results || response.data)
    } catch (error) {
      console.error("Failed to fetch packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupWebSocketConnection = () => {
    wsManager.connect("/ws/notifications/")

    wsManager.on("package_update", (data: any) => {
      console.log("[v0] Received package update:", data)
      setPackages((prev) =>
        prev.map((pkg) => (pkg.tracking_number === data.tracking_number ? { ...pkg, ...data } : pkg)),
      )
    })

    wsManager.on("new_package", (data: any) => {
      console.log("[v0] New package created:", data)
      setPackages((prev) => [data, ...prev])
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_transit":
      case "out_for_delivery":
        return <Truck className="h-4 w-4 text-accent" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in_transit":
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800"
      case "failed_delivery":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">My Shipments</h1>
            <p className="text-gray-600">Manage and track your packages</p>
          </div>
          <Link href="/ship">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Ship Package
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Packages</p>
                  <p className="text-2xl font-bold">{packages.length}</p>
                </div>
                <PackageIcon className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold">
                    {packages.filter((p) => ["in_transit", "out_for_delivery"].includes(p.status)).length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold">{packages.filter((p) => p.status === "delivered").length}</p>
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
                  <p className="text-2xl font-bold">{packages.filter((p) => p.status === "pending").length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input
                placeholder="Search packages by tracking number or recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Packages List */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Shipments</CardTitle>
            <CardDescription>Your latest package deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading packages...</p>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="text-center py-8">
                <PackageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600">No packages found</p>
                <Link href="/ship">
                  <Button className="mt-4">Ship Your First Package</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/track/${pkg.tracking_number}`}
                            className="font-semibold text-accent hover:underline"
                          >
                            {pkg.tracking_number}
                          </Link>
                          <Badge className={getStatusColor(pkg.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(pkg.status)}
                              {pkg.status.replace("_", " ")}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">To: {pkg.recipient_name}</p>
                        <p className="text-sm text-gray-600">{pkg.recipient_address}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span>Created: {new Date(pkg.created_at).toLocaleDateString()}</span>
                          {pkg.estimated_delivery && (
                            <span>Est. Delivery: {new Date(pkg.estimated_delivery).toLocaleDateString()}</span>
                          )}
                          <span>Cost: ${pkg.shipping_cost}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/track/${pkg.tracking_number}`}>
                          <Button variant="outline" size="sm">
                            Track
                          </Button>
                        </Link>
                      </div>
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