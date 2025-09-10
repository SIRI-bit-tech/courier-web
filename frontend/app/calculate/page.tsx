"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Package, Calculator, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface RateResult {
  base_rate: number
  weight_cost: number
  volume_cost: number
  total_cost: number
  currency: string
}

export default function CalculatePage() {
  const [formData, setFormData] = useState({
    sender_address: "",
    recipient_address: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    package_type: "package",
  })
  const [result, setResult] = useState<RateResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateRate = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/packages/calculate-rate/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      }
    } catch (error) {
      console.error("Failed to calculate rate:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-heading font-bold text-foreground">SwiftCourier</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <Calculator className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">Shipping Rate Calculator</h1>
            <p className="text-xl text-muted max-w-2xl mx-auto text-pretty">
              Get instant shipping quotes based on your package details and destination.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading">Package Details</CardTitle>
                <CardDescription>Enter your shipment information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="sender_address">Sender Address</Label>
                    <Input
                      id="sender_address"
                      placeholder="Enter pickup address"
                      value={formData.sender_address}
                      onChange={(e) => handleInputChange("sender_address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recipient_address">Recipient Address</Label>
                    <Input
                      id="recipient_address"
                      placeholder="Enter delivery address"
                      value={formData.recipient_address}
                      onChange={(e) => handleInputChange("recipient_address", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="package_type">Package Type</Label>
                  <Select
                    value={formData.package_type}
                    onValueChange={(value) => handleInputChange("package_type", value)}
                  >
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="0.0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="0"
                      value={formData.length}
                      onChange={(e) => handleInputChange("length", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="0"
                      value={formData.width}
                      onChange={(e) => handleInputChange("width", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="0"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={calculateRate}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Calculating..." : "Calculate Rate"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading">Rate Breakdown</CardTitle>
                <CardDescription>Your shipping cost estimate</CardDescription>
              </CardHeader>
              <CardContent>
                {result ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="bg-primary/10 p-6 rounded-lg text-center border border-primary/20">
                      <div className="text-3xl font-heading font-bold text-primary mb-2">
                        ${result.total_cost.toFixed(2)}
                      </div>
                      <div className="text-muted">Total Shipping Cost</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted">Base Rate:</span>
                        <span>${result.base_rate.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Weight Cost:</span>
                        <span>${result.weight_cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Volume Cost:</span>
                        <span>${result.volume_cost.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>
                            ${result.total_cost.toFixed(2)} {result.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Link href="/ship">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Ship This Package</Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted text-pretty">
                      Enter your package details above to get an instant shipping quote.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}