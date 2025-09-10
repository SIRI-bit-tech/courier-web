"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Package, Truck, MapPin, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleTrackPackage = async () => {
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number")
      return
    }

    if (trackingNumber.trim().length < 6) {
      setError("Tracking number should be at least 6 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await authService.trackPackage(trackingNumber.trim())

      if (result.success) {
        router.push(`/track/${trackingNumber.trim()}`)
      } else {
        setError(result.error || "Package not found")
      }
    } catch (error) {
      setError("Failed to track package. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTrackPackage()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Track Package</h1>
          <p className="text-foreground/80">Monitor your package's journey in real-time</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="font-heading flex items-center justify-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Package Tracking
              </CardTitle>
              <CardDescription>Enter your tracking number to view package details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tracking-number">Tracking Number</Label>
                <div className="relative">
                  <Input
                    id="tracking-number"
                    type="text"
                    placeholder="e.g., SC12345678"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={`border-primary/30 focus:border-primary ${error ? 'border-destructive' : ''}`}
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-600" />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                onClick={handleTrackPackage}
                disabled={loading || !trackingNumber.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {loading ? "Searching..." : "Track Package"}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-foreground/80">
                  Need help finding your tracking number?
                </p>
                <p className="text-xs text-foreground/60">
                  Check your email or contact support
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <Truck className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Real-Time Updates</h3>
                <p className="text-sm text-foreground/80">
                  Get live updates on your package location and status
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">GPS Tracking</h3>
                <p className="text-sm text-foreground/80">
                  See exactly where your package is on the map
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Delivery ETA</h3>
                <p className="text-sm text-foreground/80">
                  Know exactly when your package will arrive
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}