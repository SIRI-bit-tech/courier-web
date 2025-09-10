"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card"
import { Badge } from "@/frontend/components/ui/badge"
import { Input } from "@/frontend/components/ui/input"
import { Button } from "@/frontend/components/ui/button"
import { adminAPI } from "@/lib/admin-api"

interface Package {
  id: number
  tracking_number: string
  sender_name: string
  recipient_name: string
  status: string
  created_at: string
  weight: number
  sender: {
    email: string
  }
}

interface EmailModalProps {
  package: Package | null
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: { recipient_email: string; subject: string; message: string }) => void
}

function EmailModal({ package: pkg, isOpen, onClose, onSend }: EmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (pkg) {
      setRecipientEmail(pkg.sender.email)
      setSubject(`Package Update - ${pkg.tracking_number}`)
      setMessage(
        `Dear ${pkg.sender_name},\n\nYour package ${pkg.tracking_number} has been updated.\n\nBest regards,\nSwiftCourier Team`,
      )
    }
  }, [pkg])

  const handleSend = () => {
    onSend({ recipient_email: recipientEmail, subject, message })
    onClose()
  }

  if (!isOpen || !pkg) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Send Email Notification</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Email</label>
            <Input
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded-md h-32"
              placeholder="Email message"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSend}>Send Email</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await adminAPI.getPackages()
      setPackages(response.results || response)
    } catch (error) {
      console.error("Failed to fetch packages:", error)
    } finally {
      setLoading(false)
    }
  }

  const updatePackageStatus = async (packageId: number, newStatus: string) => {
    try {
      await adminAPI.updatePackage(packageId, { status: newStatus })
      fetchPackages()
    } catch (error) {
      console.error("Failed to update package status:", error)
    }
  }

  const handleSendEmail = async (emailData: { recipient_email: string; subject: string; message: string }) => {
    if (!selectedPackage) return

    try {
      await adminAPI.sendEmailNotification(selectedPackage.id, emailData)
      alert("Email notification sent successfully!")
    } catch (error) {
      console.error("Failed to send email:", error)
      alert("Failed to send email notification")
    }
  }

  const openEmailModal = (pkg: Package) => {
    setSelectedPackage(pkg)
    setEmailModalOpen(true)
  }

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "default"
      case "in_transit":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return <div>Loading packages...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Package Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPackages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{pkg.tracking_number}</p>
                      <p className="text-sm text-gray-500">
                        {pkg.sender_name} → {pkg.recipient_name}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(pkg.status)}>{pkg.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(pkg.created_at).toLocaleDateString()} | Weight: {pkg.weight}kg
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEmailModal(pkg)}>
                    Send Email
                  </Button>
                  <select
                    value={pkg.status}
                    onChange={(e) => updatePackageStatus(pkg.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmailModal
        package={selectedPackage}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSend={handleSendEmail}
      />
    </div>
  )
}
