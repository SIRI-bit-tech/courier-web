"use client"

import { motion } from "framer-motion"
import { Shield, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Footer } from "@/components/Footer"
import Link from "next/link"

export default function PrivacyPage() {
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
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-foreground/60">Last updated: January 2024</p>
          </div>

          <Card className="border-primary/20">
            <CardContent className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Information We Collect</h2>
                <p className="text-foreground/90 text-pretty mb-4">
                  We collect information you provide directly to us, such as when you create an account, schedule a
                  delivery, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Delivery addresses and contact details</li>
                  <li>Payment information</li>
                  <li>Package details and tracking information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                  <li>Process and fulfill delivery requests</li>
                  <li>Provide customer support and communicate with you</li>
                  <li>Send tracking updates and delivery notifications</li>
                  <li>Improve our services and user experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Information Sharing</h2>
                <p className="text-gray-600 text-pretty">
                  We do not sell, trade, or rent your personal information to third parties. We may share information
                  with service providers, business partners, or as required by law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Data Security</h2>
                <p className="text-gray-600 text-pretty">
                  We implement appropriate security measures to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Your Rights</h2>
                <ul className="list-disc list-inside space-y-2 text-foreground/80">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Request data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-semibold mb-4 text-primary">Contact Us</h2>
                <p className="text-foreground/90 text-pretty">
                  If you have questions about this Privacy Policy, please contact us at privacy@swiftcourier.com or +1
                  (555) 123-4567.
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