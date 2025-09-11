"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { adminAPI } from "@/lib/admin-api"

interface RouteStop {
  id?: number
  package: {
    id: number
    tracking_number: string
    recipient_name: string
    recipient_address: string
  }
  stop_order: number
  address: string
  latitude: number
  longitude: number
  estimated_arrival: string
  actual_arrival: string
  status: string
  notes: string
}

interface Route {
  id?: number
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

interface Package {
    id: number
    tracking_number: string
    recipient_name: string
    recipient_address: string
  }

interface Driver {
    id: number
    username: string
    first_name: string
    last_name: string
  }
  
  
interface RouteFormModalProps {
  route?: Route | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function RouteFormModal({ route, isOpen, onClose, onSave }: RouteFormModalProps) {
  const [formData, setFormData] = useState<Route>({
    driver: { id: 0, username: "", first_name: "", last_name: "" },
    route_date: "",
    status: "planned",
    total_packages: 0,
    estimated_duration: "",
    actual_duration: "",
    start_time: "",
    end_time: "",
    stops: [],
  })
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (route) {
      setFormData(route)
    } else {
      setFormData({
        driver: { id: 0, username: "", first_name: "", last_name: "" },
        route_date: new Date().toISOString().split('T')[0],
        status: "planned",
        total_packages: 0,
        estimated_duration: "",
        actual_duration: "",
        start_time: "",
        end_time: "",
        stops: [],
      })
    }
    
    // Load drivers and packages
    loadDrivers()
    loadPackages()
  }, [route])

  const loadDrivers = async () => {
    try {
      const response = await adminAPI.getUsers({ user_type: "driver" })
      setDrivers(response.results || response)
    } catch (error) {
      console.error("Failed to load drivers:", error)
    }
  }

  const loadPackages = async () => {
    try {
      const response = await adminAPI.getPackages({ status: "pending" })
      setPackages(response.results || response)
    } catch (error) {
      console.error("Failed to load packages:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create/update route logic here
      // This would need to be implemented in your adminAPI
      console.log("Route data:", formData)
      onSave()
      onClose()
    } catch (error) {
      console.error("Failed to save route:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find(d => d.id === parseInt(driverId))
    if (driver) {
      setFormData(prev => ({ ...prev, driver }))
    }
  }

  const addStop = () => {
    const newStop: RouteStop = {
      package: { id: 0, tracking_number: "", recipient_name: "", recipient_address: "" },
      stop_order: formData.stops.length + 1,
      address: "",
      latitude: 0,
      longitude: 0,
      estimated_arrival: "",
      actual_arrival: "",
      status: "pending",
      notes: "",
    }
    setFormData(prev => ({ ...prev, stops: [...prev.stops, newStop] }))
  }

  const removeStop = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((stop, i) => ({
        ...stop,
        stop_order: i + 1
      }))
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{route ? "Edit Route" : "Create New Route"}</DialogTitle>
          <DialogDescription>
            {route ? "Update route information" : "Create a new delivery route"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Route Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Driver</Label>
                <Select onValueChange={handleDriverChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.first_name} {driver.last_name} ({driver.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="route_date">Route Date</Label>
                <Input
                  id="route_date"
                  type="date"
                  value={formData.route_date}
                  onChange={(e) => handleChange("route_date", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_duration">Estimated Duration (hours)</Label>
                <Input
                  id="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={(e) => handleChange("estimated_duration", e.target.value)}
                  placeholder="e.g., 8:00"
                />
              </div>
            </div>
          </div>

          {/* Route Stops */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Route Stops</h3>
              <Button type="button" onClick={addStop} variant="outline">
                Add Stop
              </Button>
            </div>

            {formData.stops.map((stop, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Stop #{stop.stop_order}</h4>
                  <Button type="button" onClick={() => removeStop(index)} variant="destructive" size="sm">
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Package</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id.toString()}>
                            {pkg.tracking_number} - {pkg.recipient_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={stop.status} onValueChange={(value) => {
                      const updatedStops = [...formData.stops]
                      updatedStops[index].status = value
                      setFormData(prev => ({ ...prev, stops: updatedStops }))
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="skipped">Skipped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={stop.address}
                    onChange={(e) => {
                      const updatedStops = [...formData.stops]
                      updatedStops[index].address = e.target.value
                      setFormData(prev => ({ ...prev, stops: updatedStops }))
                    }}
                    placeholder="Delivery address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Arrival</Label>
                    <Input
                      type="datetime-local"
                      value={stop.estimated_arrival}
                      onChange={(e) => {
                        const updatedStops = [...formData.stops]
                        updatedStops[index].estimated_arrival = e.target.value
                        setFormData(prev => ({ ...prev, stops: updatedStops }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={stop.notes}
                      onChange={(e) => {
                        const updatedStops = [...formData.stops]
                        updatedStops[index].notes = e.target.value
                        setFormData(prev => ({ ...prev, stops: updatedStops }))
                      }}
                      placeholder="Special instructions"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : route ? "Update Route" : "Create Route"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}