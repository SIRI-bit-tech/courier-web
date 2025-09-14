"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Truck, Package, MapPin, User, CreditCard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth"
import { CreatePackageData } from "@/lib/auth"

interface ShippingForm {
  // Package details
  weight: string
  length: string
  width: string
  height: string
  packageType: string
  description: string

  // Receiver details
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCity: string
  receiverState: string
  receiverZip: string
}

export default function ShipPage() {
  const [formData, setFormData] = useState<ShippingForm>({
    weight: "",
    length: "",
    width: "",
    height: "",
    packageType: "package",
    description: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    receiverCity: "",
    receiverState: "",
    receiverZip: "",
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      // Get current user information for sender details
      const currentUser = await authService.getCurrentUser()
      
      if (!currentUser) {
        setError("User authentication required. Please log in again.")
        return
      }

      // User data validation (allow package creation even with incomplete profile)
      const hasValidName = (currentUser.first_name && currentUser.last_name && 
                          currentUser.first_name.trim() !== '' && 
                          currentUser.last_name.trim() !== '') || true // Allow even if missing
      
      const hasValidAddress = (currentUser.address && currentUser.city && 
                             currentUser.state && currentUser.zip_code &&
                             currentUser.address.trim() !== '' && 
                             currentUser.city.trim() !== '' &&
                             currentUser.state.trim() !== '' &&
                             currentUser.zip_code.trim() !== '') || true // Allow even if missing

      const hasValidPhone = (currentUser.phone_number && 
                           currentUser.phone_number.trim() !== '') || true // Allow even if missing

      // Allow package creation even with incomplete profile data
      // The packageData object below will use fallback values for missing data

      // Convert and validate numeric values
      const weightNum = parseFloat(formData.weight) || 0.1
      const lengthNum = parseFloat(formData.length) || 0
      const widthNum = parseFloat(formData.width) || 0
      const heightNum = parseFloat(formData.height) || 0
      
      const packageData: CreatePackageData = {
        // Sender details from user profile - handle missing data gracefully
        sender_name: currentUser.first_name && currentUser.last_name 
          ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
          : 'Unknown Sender',
        sender_phone: currentUser.phone_number?.trim() || '000-000-0000',
        sender_address: currentUser.address?.trim() || 'No address provided',
        sender_city: currentUser.city?.trim() || 'Unknown',
        sender_state: currentUser.state?.trim() || 'Unknown',
        sender_zip: currentUser.zip_code?.trim() || '00000',

        // Package details - use converted numeric values
        weight: weightNum,
        length: lengthNum,
        width: widthNum,
        height: heightNum,
        package_type: formData.packageType || 'package',
        description: formData.description,

        // Receiver details - use form data directly
        recipient_name: formData.receiverName?.trim() || 'Unknown Recipient',
        recipient_phone: formData.receiverPhone?.trim() || '000-000-0000',
        recipient_address: formData.receiverAddress?.trim() || 'No address provided',
        recipient_city: formData.receiverCity?.trim() || 'Unknown',
        recipient_state: formData.receiverState?.trim() || 'Unknown',
        recipient_zip: formData.receiverZip?.trim() || '00000',
      }

      // Debug: Log the actual data being sent
      // console.log('📤 SUBMITTING PACKAGE DATA:', {
      //   formData: formData,
      //   packageData: packageData,
      //   weightNum: weightNum,
      //   currentUser: currentUser
      // })

      // Validate required form fields (not profile fields)
      if (!formData.weight || isNaN(weightNum) || weightNum <= 0) {
        setError("Package weight is required and must be greater than 0.")
        return
      }
      
      if (!formData.packageType) {
        setError("Package type is required.")
        return
      }
      
      if (!formData.receiverName || !formData.receiverName.trim()) {
        setError("Recipient name is required.")
        return
      }
      
      if (!formData.receiverAddress || !formData.receiverAddress.trim()) {
        setError("Recipient address is required.")
        return
      }

      const result = await authService.createPackage(packageData)

      if (result.success) {
        router.push(`/track/${result.package.tracking_number}`)
      } else {
        // Handle field errors better
        if (result.field_errors) {
          const errorMessages = []
          
          // Handle sender errors
          if (result.field_errors.sender_name) {
            errorMessages.push("Please update your profile with your full name.")
          }
          if (result.field_errors.sender_phone) {
            errorMessages.push("Please update your profile with your phone number.")
          }
          if (result.field_errors.sender_address || result.field_errors.sender_city || 
              result.field_errors.sender_state || result.field_errors.sender_zip) {
            errorMessages.push("Please update your profile with your complete address.")
          }
          
          // Handle receiver errors
          if (result.field_errors.recipient_name) {
            errorMessages.push("Receiver name is required.")
          }
          if (result.field_errors.recipient_phone) {
            errorMessages.push("Receiver phone number is required.")
          }
          if (result.field_errors.recipient_address || result.field_errors.recipient_city ||
              result.field_errors.recipient_state || result.field_errors.recipient_zip) {
            errorMessages.push("Complete receiver address information is required.")
          }
          
          // Handle package errors
          if (result.field_errors.weight) {
            errorMessages.push("Package weight is required.")
          }
          if (result.field_errors.package_type) {
            errorMessages.push("Package type is required.")
          }
          
          if (errorMessages.length > 0) {
            setError(errorMessages.join(" "))
          } else {
            setError(result.error || "Failed to create package. Please try again.")
          }
        } else {
          setError(result.error || "Failed to create package. Please try again.")
        }
      }
    } catch (error: any) {
      console.error("Package creation error:", error)
      setError("Failed to create package. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, name: "Package", icon: Package },
    { id: 2, name: "Receiver", icon: MapPin },
    { id: 3, name: "Review", icon: CreditCard },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Ship Package</h1>
          <p className="text-muted">Create a new shipping request</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {currentStep === 1 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading">Package Details</CardTitle>
                <CardDescription>Tell us about your package</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="0.5"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageType">Package Type</Label>
                    <Select value={formData.packageType} onValueChange={(value) => handleInputChange("packageType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="package">Package</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="fragile">Fragile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="30"
                      value={formData.length}
                      onChange={(e) => handleInputChange("length", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="20"
                      value={formData.width}
                      onChange={(e) => handleInputChange("width", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="10"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Package Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the contents of your package"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading">Receiver Information</CardTitle>
                <CardDescription>Where is the package going?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receiverName">Full Name</Label>
                    <Input
                      id="receiverName"
                      placeholder="Jane Smith"
                      value={formData.receiverName}
                      onChange={(e) => handleInputChange("receiverName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiverPhone">Phone Number</Label>
                    <Input
                      id="receiverPhone"
                      placeholder="+1 (555) 987-6543"
                      value={formData.receiverPhone}
                      onChange={(e) => handleInputChange("receiverPhone", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receiverAddress">Street Address</Label>
                  <Input
                    id="receiverAddress"
                    placeholder="456 Oak Avenue"
                    value={formData.receiverAddress}
                    onChange={(e) => handleInputChange("receiverAddress", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receiverCity">City</Label>
                    <Input
                      id="receiverCity"
                      placeholder="Los Angeles"
                      value={formData.receiverCity}
                      onChange={(e) => handleInputChange("receiverCity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiverState">State</Label>
                    <Input
                      id="receiverState"
                      placeholder="CA"
                      value={formData.receiverState}
                      onChange={(e) => handleInputChange("receiverState", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="receiverZip">ZIP Code</Label>
                  <Input
                    id="receiverZip"
                    placeholder="90210"
                    value={formData.receiverZip}
                    onChange={(e) => handleInputChange("receiverZip", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading">Review & Confirm</CardTitle>
                <CardDescription>Please review your shipping details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-primary mb-3">Package Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Weight:</span> {formData.weight} kg</p>
                      <p><span className="text-gray-600">Dimensions:</span> {formData.length}×{formData.width}×{formData.height} cm</p>
                      <p><span className="text-gray-600">Type:</span> {formData.packageType}</p>
                      <p><span className="text-gray-600">Description:</span> {formData.description}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-primary mb-3">Receiver Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Name:</span> {formData.receiverName}</p>
                      <p><span className="text-gray-600">Phone:</span> {formData.receiverPhone}</p>
                      <p><span className="text-gray-600">Address:</span> {formData.receiverAddress}</p>
                      <p><span className="text-gray-600">City/State:</span> {formData.receiverCity}, {formData.receiverState}</p>
                      <p><span className="text-gray-600">ZIP:</span> {formData.receiverZip}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ready to ship your package?</p>
                      <p className="text-sm text-gray-600">You'll receive a tracking number after creation.</p>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {loading ? "Creating Package..." : "Ship Package"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              onClick={currentStep === 3 ? handleSubmit : nextStep}
              disabled={currentStep === 3 && loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {currentStep === 3 ? "Ship Package" : "Next"}
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}