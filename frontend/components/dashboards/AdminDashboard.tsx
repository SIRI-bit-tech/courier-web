"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Package, Users, Truck, DollarSign, TrendingUp, Activity, 
  Search, Plus, Edit, Trash2, Eye, MapPin, Settings,
  CheckCircle, XCircle, Clock, User, Mail, Phone, Car,
  Home, Map, Calendar, Filter, Download, Upload, FileText,
  History, Bell, Zap, RefreshCw
} from "lucide-react"

// Individual UI component imports
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

// Other imports remain the same
import { UserFormModal } from "@/components/admin/UserFormModal"
import { PackageFormModal } from "@/components/admin/PackageFormModal"
import { RouteFormModal } from "@/components/admin/RouteFormModal"
import { adminAPI } from "@/lib/admin-api"

// Interfaces matching your Django models exactly
interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: string
  phone_number: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  is_active_driver: boolean
  driver_license: string
  vehicle_info: string
  is_active: boolean
  date_joined: string
  created_at: string
}

interface Package {
  id: number
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  weight: number
  shipping_cost: string
  created_at: string
  package_type: string
  sender: {
    username: string
    email: string
  }
  qr_code: string
  sender_email: string
  sender_phone: string
  sender_address: string
  sender_city: string
  sender_state: string
  sender_zip: string
  recipient_email: string
  recipient_phone: string
  recipient_address: string
  recipient_city: string
  recipient_state: string
  recipient_zip: string
  length: number
  width: number
  height: number
  declared_value: number
}

interface Route {
  id: number
  driver: {
    id: number
    username: string
    first_name: string
    last_name: string
  }
  route_date: string
  status: string
  total_packages: number
  estimated_duration: string
  actual_duration: string
  start_time: string
  end_time: string
  stops: RouteStop[]
}

interface RouteStop {
  id: number
  package: Package
  stop_order: number
  address: string
  latitude: number
  longitude: number
  estimated_arrival: string
  actual_arrival: string
  status: string
  notes: string
}

interface ServiceArea {
  id: number
  area_name: string
  base_rate: string
  per_mile_rate: string
  active: boolean
  coordinates: any
  created_at: string
}

interface TrackingEvent {
  id: number
  package: Package
  status: string
  description: string
  location: string
  latitude: number
  longitude: number
  timestamp: string
  created_by: User
}

interface Notification {
  id: number
  package: Package
  type: string
  recipient: string
  message: string
  status: string
  sent_at: string
  error_message: string
}

interface ChangeHistory {
  id: number
  object_id: number
  object_type: string
  field_name: string
  old_value: string
  new_value: string
  changed_by: User
  changed_at: string
}

interface Stats {
  total_packages: number
  total_users: number
  active_drivers: number
  total_revenue: number
  packages_today: number
  deliveries_completed: number
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<Stats>({
    total_packages: 0,
    total_users: 0,
    active_drivers: 0,
    total_revenue: 0,
    packages_today: 0,
    deliveries_completed: 0,
  })
  
  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalItems, setTotalItems] = useState(0)
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  
  // Filter states (matching your Django admin filters)
  const [userTypeFilter, setUserTypeFilter] = useState("")
  const [userActiveFilter, setUserActiveFilter] = useState("")
  const [packageStatusFilter, setPackageStatusFilter] = useState("")
  const [packageTypeFilter, setPackageTypeFilter] = useState("")
  const [routeStatusFilter, setRouteStatusFilter] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [weightMinFilter, setWeightMinFilter] = useState("")
  const [weightMaxFilter, setWeightMaxFilter] = useState("")
  const [costMinFilter, setCostMinFilter] = useState("")
  const [costMaxFilter, setCostMaxFilter] = useState("")
  
  // Modal states
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [packageDialogOpen, setPackageDialogOpen] = useState(false)
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{type: string, id: number} | null>(null)

  useEffect(() => {
    fetchData()
    setupRealTimeConnection()
  }, [activeTab, currentPage, pageSize])

  const setupRealTimeConnection = () => {
    const ws = adminAPI.connectWebSocket((data) => {
      if (data.type === 'package_status_changed') {
        // Refresh package data
        fetchData()
      } else if (data.type === 'user_created') {
        // Refresh user data
        fetchData()
      }
      setRealTimeConnected(true)
    })
    
    return () => {
      if (ws) ws.close()
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "dashboard") {
        const statsResponse = await adminAPI.getAdminStats()
        setStats(statsResponse)
      } else if (activeTab === "users") {
        const usersResponse = await adminAPI.getUsers({
          user_type: userTypeFilter || undefined,
          search: searchTerm || undefined,
          is_active: userActiveFilter ? userActiveFilter === "true" : undefined,
          date_joined_from: dateFromFilter || undefined,
          date_joined_to: dateToFilter || undefined,
          page: currentPage,
          page_size: pageSize
        })
        setUsers(usersResponse.results || usersResponse)
        setTotalItems(usersResponse.count || usersResponse.length)
      } else if (activeTab === "packages") {
        const packagesResponse = await adminAPI.getPackages({
          status: packageStatusFilter || undefined,
          package_type: packageTypeFilter || undefined,
          search: searchTerm || undefined,
          weight_min: weightMinFilter ? parseFloat(weightMinFilter) : undefined,
          weight_max: weightMaxFilter ? parseFloat(weightMaxFilter) : undefined,
          cost_min: costMinFilter ? parseFloat(costMinFilter) : undefined,
          cost_max: costMaxFilter ? parseFloat(costMaxFilter) : undefined,
          created_from: dateFromFilter || undefined,
          created_to: dateToFilter || undefined,
          page: currentPage,
          page_size: pageSize
        })
        setPackages(packagesResponse.results || packagesResponse)
        setTotalItems(packagesResponse.count || packagesResponse.length)
      } else if (activeTab === "routes") {
        const routesResponse = await adminAPI.getRoutes()
        setRoutes(routesResponse.results || routesResponse)
        setTotalItems(routesResponse.count || routesResponse.length)
      } else if (activeTab === "service-areas") {
        const areasResponse = await adminAPI.getServiceAreas()
        setServiceAreas(areasResponse.results || areasResponse)
        setTotalItems(areasResponse.count || areasResponse.length)
      } else if (activeTab === "tracking") {
        const trackingResponse = await adminAPI.getTrackingEvents({
          created_from: dateFromFilter || undefined,
          created_to: dateToFilter || undefined,
          page: currentPage
        })
        setTrackingEvents(trackingResponse.results || trackingResponse)
        setTotalItems(trackingResponse.count || trackingResponse.length)
      } else if (activeTab === "notifications") {
        const notificationsResponse = await adminAPI.getNotifications({
          sent_from: dateFromFilter || undefined,
          sent_to: dateToFilter || undefined,
          page: currentPage
        })
        setNotifications(notificationsResponse.results || notificationsResponse)
        setTotalItems(notificationsResponse.count || notificationsResponse.length)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  // CRUD operations matching your Django admin
  const handleDeleteUser = async (userId: number) => {
    try {
      await adminAPI.deleteUser(userId)
      fetchData()
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const handleDeletePackage = async (packageId: number) => {
    try {
      await adminAPI.deletePackage(packageId)
      fetchData()
    } catch (error) {
      console.error("Failed to delete package:", error)
    }
  }

  const handleStatusChange = async (packageId: number, status: string) => {
    try {
      await adminAPI.updatePackage(packageId, { status })
      fetchData()
    } catch (error) {
      console.error("Failed to update package:", error)
    }
  }

  // Bulk operations
  const handleBulkDelete = async (items: number[], type: string) => {
    try {
      if (type === 'users') {
        await adminAPI.bulkDeleteUsers(items)
      } else if (type === 'packages') {
        await adminAPI.bulkDeletePackages(items)
      }
      setSelectedItems([])
      fetchData()
    } catch (error) {
      console.error(`Failed to bulk delete ${type}:`, error)
    }
  }

  const handleBulkUpdate = async (items: number[], updates: any, type: string) => {
    try {
      if (type === 'users') {
        await adminAPI.bulkUpdateUsers(items, updates)
      } else if (type === 'packages') {
        await adminAPI.bulkUpdatePackages(items, updates)
      }
      setSelectedItems([])
      fetchData()
    } catch (error) {
      console.error(`Failed to bulk update ${type}:`, error)
    }
  }

  // Export functions
  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      let blob: Blob
      if (activeTab === 'users') {
        blob = await adminAPI.exportUsers(format, {
          user_type: userTypeFilter || undefined,
          search: searchTerm || undefined,
          is_active: userActiveFilter ? userActiveFilter === "true" : undefined,
        })
      } else if (activeTab === 'packages') {
        blob = await adminAPI.exportPackages(format, {
          status: packageStatusFilter || undefined,
          package_type: packageTypeFilter || undefined,
          search: searchTerm || undefined,
        })
      } else {
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  // History functions
  const handleViewHistory = async (type: string, id: number) => {
    try {
      let historyData
      if (type === 'user') {
        historyData = await adminAPI.getUserChangeHistory(id)
      } else if (type === 'package') {
        historyData = await adminAPI.getPackageChangeHistory(id)
      }
      setChangeHistory(historyData)
      setSelectedHistoryItem({ type, id })
      setHistoryDialogOpen(true)
    } catch (error) {
      console.error("Failed to fetch history:", error)
    }
  }

  // Filter functions
  const applyFilters = () => {
    setCurrentPage(1)
    fetchData()
  }

  const clearFilters = () => {
    setSearchTerm("")
    setUserTypeFilter("")
    setUserActiveFilter("")
    setPackageStatusFilter("")
    setPackageTypeFilter("")
    setRouteStatusFilter("")
    setDateFromFilter("")
    setDateToFilter("")
    setWeightMinFilter("")
    setWeightMaxFilter("")
    setCostMinFilter("")
    setCostMaxFilter("")
    setCurrentPage(1)
    fetchData()
  }

  // Status color functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800"
      case "in_transit": return "bg-blue-100 text-blue-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "picked_up": return "bg-purple-100 text-purple-800"
      case "out_for_delivery": return "bg-orange-100 text-orange-800"
      case "failed_delivery": return "bg-red-100 text-red-800"
      case "returned": return "bg-gray-100 text-gray-800"
      case "cancelled": return "bg-red-200 text-red-900"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin": return "bg-red-100 text-red-800"
      case "driver": return "bg-blue-100 text-blue-800"
      case "customer": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Filtered data
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.includes(searchTerm) ||
    user.driver_license?.includes(searchTerm)
  )

  const filteredPackages = packages.filter(pkg =>
    pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.sender.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRoutes = routes.filter(route =>
    route.driver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.id.toString().includes(searchTerm)
  )

  if (loading && activeTab !== "dashboard") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {activeTab}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          {realTimeConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Date Range Filters */}
              <div className="p-3 space-y-3">
                <div>
                  <Label className="text-xs font-medium">Date From</Label>
                  <Input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Date To</Label>
                  <Input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>

              {activeTab === "users" && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-3">
                    <Label className="text-xs">User Type</Label>
                    <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-3">
                    <Label className="text-xs">Active Status</Label>
                    <Select value={userActiveFilter} onValueChange={setUserActiveFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {activeTab === "packages" && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-3">
                    <Label className="text-xs">Package Status</Label>
                    <Select value={packageStatusFilter} onValueChange={setPackageStatusFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed_delivery">Failed Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-3">
                    <Label className="text-xs">Package Type</Label>
                    <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="package">Package</SelectItem>
                        <SelectItem value="fragile">Fragile</SelectItem>
                        <SelectItem value="perishable">Perishable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight and Cost Filters */}
                  <div className="p-3 space-y-2">
                    <Label className="text-xs">Weight Range (kg)</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Min"
                        value={weightMinFilter}
                        onChange={(e) => setWeightMinFilter(e.target.value)}
                        className="h-8"
                      />
                      <Input
                        placeholder="Max"
                        value={weightMaxFilter}
                        onChange={(e) => setWeightMaxFilter(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <Label className="text-xs">Cost Range ($)</Label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Min"
                        value={costMinFilter}
                        onChange={(e) => setCostMinFilter(e.target.value)}
                        className="h-8"
                      />
                      <Input
                        placeholder="Max"
                        value={costMaxFilter}
                        onChange={(e) => setCostMaxFilter(e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <DropdownMenuSeparator />
              <div className="p-3 space-y-2">
                <Button onClick={applyFilters} size="sm" className="w-full">
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <Label className="text-sm">Show:</Label>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_packages}</div>
                <p className="text-xs text-muted-foreground">All time packages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_drivers}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.total_revenue}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Packages Today</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.packages_today}</div>
                <p className="text-xs text-muted-foreground">Created today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.deliveries_completed}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">User Management</h2>
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedItems.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Users</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedItems.length} selected users? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBulkDelete(selectedItems, 'users')}>
                          Delete Users
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Bulk Update
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkUpdate(selectedItems, { is_active: true }, 'users')}>
                        Activate Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate(selectedItems, { is_active: false }, 'users')}>
                        Deactivate Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <Button onClick={() => {
                setEditingUser(null)
                setUserDialogOpen(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedItems(filteredUsers.map(user => user.id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(user.id)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, user.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== user.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>
                        <Badge className={getUserTypeColor(user.user_type)}>
                          {user.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone_number || '-'}</TableCell>
                      <TableCell>
                        {user.is_active_driver ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewHistory('user', user.id)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setUserDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.username}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalItems / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(totalItems / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* PACKAGES TAB */}
        <TabsContent value="packages" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Package Management</h2>
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedItems.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Packages</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedItems.length} selected packages? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleBulkDelete(selectedItems, 'packages')}>
                          Delete Packages
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Bulk Update
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkUpdate(selectedItems, { status: 'delivered' }, 'packages')}>
                        Mark as Delivered
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkUpdate(selectedItems, { status: 'in_transit' }, 'packages')}>
                        Mark as In Transit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <Button onClick={() => setPackageDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.length === filteredPackages.length && filteredPackages.length > 0}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setSelectedItems(filteredPackages.map(pkg => pkg.id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.includes(pkg.id)}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, pkg.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== pkg.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pkg.tracking_number}</TableCell>
                      <TableCell>{pkg.sender_name}</TableCell>
                      <TableCell>{pkg.recipient_name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(pkg.status)}>
                          {pkg.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.package_type}</Badge>
                      </TableCell>
                      <TableCell>{pkg.weight}kg</TableCell>
                      <TableCell>${pkg.shipping_cost}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewHistory('package', pkg.id)}>
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select onValueChange={(value: string) => handleStatusChange(pkg.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="picked_up">Picked Up</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="failed_delivery">Failed Delivery</SelectItem>
                              <SelectItem value="returned">Returned</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Package</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete package {pkg.tracking_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePackage(pkg.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} packages
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalItems / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(totalItems / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ROUTES TAB */}
        <TabsContent value="routes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Route Management</h2>
            <Button onClick={() => setRouteDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Route
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route ID</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">#{route.id}</TableCell>
                      <TableCell>{route.driver.first_name} {route.driver.last_name}</TableCell>
                      <TableCell>{new Date(route.route_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{route.status}</Badge>
                      </TableCell>
                      <TableCell>{route.total_packages}</TableCell>
                      <TableCell>{route.estimated_duration || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SERVICE AREAS TAB */}
        <TabsContent value="service-areas" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Service Area Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service Area
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Per Mile Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceAreas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.area_name}</TableCell>
                      <TableCell>${area.base_rate}</TableCell>
                      <TableCell>${area.per_mile_rate}</TableCell>
                      <TableCell>
                        {area.active ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(area.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRACKING TAB */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Tracking Events</h2>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.package.tracking_number}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.location || '-'}</TableCell>
                      <TableCell>{event.created_by.username}</TableCell>
                      <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.package.tracking_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.type}</Badge>
                      </TableCell>
                      <TableCell>{notification.recipient}</TableCell>
                      <TableCell>
                        {notification.status === 'sent' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{notification.sent_at ? new Date(notification.sent_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change History Modal */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Change History</DialogTitle>
            <DialogDescription>
              View all changes made to this {selectedHistoryItem?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Changed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changeHistory.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>{change.field_name}</TableCell>
                    <TableCell>{change.old_value || '-'}</TableCell>
                    <TableCell>{change.new_value}</TableCell>
                    <TableCell>{change.changed_by.username}</TableCell>
                    <TableCell>{new Date(change.changed_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <UserFormModal
        user={editingUser as any}
        isOpen={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onSave={fetchData}
      />

      <PackageFormModal
        package={editingPackage as any}
        isOpen={packageDialogOpen}
        onClose={() => setPackageDialogOpen(false)}
        onSave={fetchData}
      />

      <RouteFormModal
        route={editingRoute as any}
        isOpen={routeDialogOpen}
        onClose={() => setRouteDialogOpen(false)}
        onSave={fetchData}
      />
    </div>
  )
}