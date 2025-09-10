"use client"

import { motion } from "framer-motion"
import { FileText, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Footer } from "@/components/Footer"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
             <SwiftCourierLogo className="h-8 w-auto mr-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-12">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-foreground/60">Last updated: January 2024</p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">1. Acceptance of Terms</h2>
                <p className="text-foreground/90 text-pretty">
                  By using SwiftCourier's services, you agree to be bound by these Terms of Service. If you do not agree
                  to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">2. Service Description</h2>
                <p className="text-foreground/90 text-pretty">
                  SwiftCourier provides courier and delivery services including package pickup, transportation, and
                  delivery. We offer real-time tracking and various delivery options.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">3. User Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                  <li>Provide accurate pickup and delivery information</li>
                  <li>Ensure packages are properly packaged and labeled</li>
                  <li>Comply with shipping restrictions and regulations</li>
                  <li>Pay all applicable fees and charges</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">4. Prohibited Items</h2>
                <p className="text-gray-600 text-pretty">
                  We do not accept hazardous materials, illegal substances, perishable items without proper packaging,
                  or items that violate local, national, or international laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">5. Liability and Insurance</h2>
                <p className="text-gray-600 text-pretty">
                  SwiftCourier provides basic insurance coverage for packages. Additional insurance is available for
                  high-value items. Our liability is limited to the declared value of the package or actual loss,
                  whichever is less.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">6. Privacy Policy</h2>
                <p className="text-gray-600 text-pretty">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use,
                  and protect your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">7. Contact Information</h2>
                <p className="text-gray-600 text-pretty">
                  For questions about these Terms of Service, please contact us at legal@swiftcourier.com or +1 (555)
                  123-4567.
                </p>
              </section>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  )
}