"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Package, CheckCircle, Truck, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { wsManager } from "@/lib/websocket"

interface Notification {
  id: string
  type: "success" | "info" | "warning" | "error"
  title: string
  message: string
  timestamp: Date
}

interface RealTimeNotificationsProps {
  trackingNumber?: string
}

export function RealTimeNotifications({ trackingNumber }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!trackingNumber) return

    wsManager.connect(`/ws/tracking/${trackingNumber}/`)

    wsManager.on("package_update", (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: getNotificationType(data.data.status),
        title: "Package Update",
        message: `Your package is now ${data.data.status.replace("_", " ")}`,
        timestamp: new Date(),
      }

      setNotifications((prev) => [notification, ...prev.slice(0, 4)]) // Keep only 5 notifications

      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, 5000)
    })

    return () => wsManager.disconnect()
  }, [trackingNumber])

  const getNotificationType = (status: string): Notification["type"] => {
    switch (status) {
      case "delivered":
        return "success"
      case "failed_delivery":
        return "error"
      case "in_transit":
      case "out_for_delivery":
        return "info"
      default:
        return "info"
    }
  }

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Truck className="h-5 w-5 text-blue-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            className="w-full"
          >
            <Card className="shadow-lg border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted mt-1">{notification.message}</p>
                    <p className="text-xs text-muted mt-2">{notification.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNotification(notification.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
