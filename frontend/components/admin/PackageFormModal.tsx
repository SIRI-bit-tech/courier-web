"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { adminAPI } from "@/lib/admin-api"

interface Package {
  id?: number
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  weight: number
  shipping_cost: string
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

interface PackageFormModalProps {
  package?: Package | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function PackageFormModal({ package: pkg, isOpen, onClose, onSave }: PackageFormModalProps) {
  const [formData, setFormData] = useState<Package>({
    tracking_number: "",
    sender_name: "",
    recipient_name: "",
    status: "pending",
    weight: 0,
    shipping_cost: "0.00",
    package_type: "package",
    sender: { username: "", email: "" },
    qr_code: "",
    sender_email: "",
    sender_phone: "",
    sender_address: "",
    sender_city: "",
    sender_state: "",
    sender_zip: "",
    recipient_email: "",
    recipient_phone: "",
    recipient_address: "",
    recipient_city: "",
    recipient_state: "",
    recipient_zip: "",
    length: 0,
    width: 0,
    height: 0,
    declared_value: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pkg) {
      setFormData(pkg)
    } else {
      setFormData({
        tracking_number: "",
        sender_name: "",
        recipient_name: "",
        status: "pending",
        weight: 0,
        shipping_cost: "0.00",
        package_type: "package",
        sender: { username: "", email: "" },
        qr_code: "",
        sender_email: "",
        sender_phone: "",
        sender_address: "",
        sender_city: "",
        sender_state: "",
        sender_zip: "",
        recipient_email: "",
        recipient_phone: "",
        recipient_address: "",
        recipient_city: "",
        recipient_state: "",
        recipient_zip: "",
        length: 0,
        width: 0,
        height: 0,
        declared_value: 0,
      })
    }
  }, [pkg])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (pkg?.id) {
        await adminAPI.updatePackage(pkg.id, formData)
      } else {
        await adminAPI.createPackage(formData)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Failed to save package:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit Package" : "Add New Package"}</DialogTitle>
          <DialogDescription>
            {pkg ? "Update package information" : "Create a new package"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Package Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Package Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="package_type">Package Type</Label>
                <Select value={formData.package_type} onValueChange={(value) => handleChange("package_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="fragile">Fragile</SelectItem>
                    <SelectItem value="perishable">Perishable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
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
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleChange("length", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleChange("width", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange("height", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="declared_value">Declared Value ($)</Label>
                <Input
                  id="declared_value"
                  type="number"
                  step="0.01"
                  value={formData.declared_value}
                  onChange={(e) => handleChange("declared_value", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_cost">Shipping Cost ($)</Label>
              <Input
                id="shipping_cost"
                type="number"
                step="0.01"
                value={formData.shipping_cost}
                onChange={(e) => handleChange("shipping_cost", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Sender Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sender Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sender_name">Sender Name</Label>
              <Input
                id="sender_name"
                value={formData.sender_name}
                onChange={(e) => handleChange("sender_name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_email">Sender Email</Label>
                <Input
                  id="sender_email"
                  type="email"
                  value={formData.sender_email}
                  onChange={(e) => handleChange("sender_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_phone">Sender Phone</Label>
                <Input
                  id="sender_phone"
                  value={formData.sender_phone}
                  onChange={(e) => handleChange("sender_phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_address">Sender Address</Label>
              <Textarea
                id="sender_address"
                value={formData.sender_address}
                onChange={(e) => handleChange("sender_address", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender_city">City</Label>
                <Input
                  id="sender_city"
                  value={formData.sender_city}
                  onChange={(e) => handleChange("sender_city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_state">State</Label>
                <Input
                  id="sender_state"
                  value={formData.sender_state}
                  onChange={(e) => handleChange("sender_state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender_zip">ZIP</Label>
                <Input
                  id="sender_zip"
                  value={formData.sender_zip}
                  onChange={(e) => handleChange("sender_zip", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recipient Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Recipient Name</Label>
              <Input
                id="recipient_name"
                value={formData.recipient_name}
                onChange={(e) => handleChange("recipient_name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_email">Recipient Email</Label>
                <Input
                  id="recipient_email"
                  type="email"
                  value={formData.recipient_email}
                  onChange={(e) => handleChange("recipient_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_phone">Recipient Phone</Label>
                <Input
                  id="recipient_phone"
                  value={formData.recipient_phone}
                  onChange={(e) => handleChange("recipient_phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_address">Recipient Address</Label>
              <Textarea
                id="recipient_address"
                value={formData.recipient_address}
                onChange={(e) => handleChange("recipient_address", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_city">City</Label>
                <Input
                  id="recipient_city"
                  value={formData.recipient_city}
                  onChange={(e) => handleChange("recipient_city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_state">State</Label>
                <Input
                  id="recipient_state"
                  value={formData.recipient_state}
                  onChange={(e) => handleChange("recipient_state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_zip">ZIP</Label>
                <Input
                  id="recipient_zip"
                  value={formData.recipient_zip}
                  onChange={(e) => handleChange("recipient_zip", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : pkg ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}