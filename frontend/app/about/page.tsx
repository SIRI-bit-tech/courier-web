"use client"

import { motion } from "framer-motion"
import { Package, Users, Globe, Clock, Shield, Star, Award, Truck } from "lucide-react"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/Footer"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <SwiftCourierLogo className="h-10 w-auto mr-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">About SwiftCourier</h1>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto text-balance">
              Leading the future of delivery services with cutting-edge technology, unmatched reliability, and
              customer-first approach since 2020.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-foreground/60">Packages Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-foreground/60">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.8%</div>
              <div className="text-foreground/60">On-Time Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-foreground/60">Customer Support</div>
            </div>
          </div>

          {/* Mission & Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 text-pretty">
                  To revolutionize the delivery industry by providing fast, reliable, and transparent courier services
                  that connect businesses and individuals across the globe with cutting-edge technology and exceptional
                  service.
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-foreground/80">
                  <li>• Reliability and trust in every delivery</li>
                  <li>• Innovation through technology</li>
                  <li>• Transparency and real-time tracking</li>
                  <li>• Environmental responsibility</li>
                  <li>• Customer satisfaction first</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-primary/20">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Global Network</CardTitle>
                <CardDescription>Extensive delivery network spanning multiple countries and regions</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Real-Time Tracking</CardTitle>
                <CardDescription>Live GPS tracking and instant notifications for complete transparency</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Secure Delivery</CardTitle>
                <CardDescription>Advanced security measures and insurance coverage for peace of mind</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </motion.div>
      </div>
      {/* Footer */}
      <Footer /> 
    </div>
  )
}