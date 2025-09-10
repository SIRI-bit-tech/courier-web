"use client"

import { motion } from "framer-motion"
import { Search, Package, Shield, Clock, MapPin, Truck, Star } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState("")

  const handleTrackPackage = () => {
    if (trackingNumber.trim()) {
      window.location.href = `/track/${trackingNumber}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
             <SwiftCourierLogo className="h-14 w-auto mr-3" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Login
              </Link>
              <Link href="/register">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20">
        {/* Background image with transparent overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-heading font-bold mb-6 text-foreground">
              Fast, Reliable Delivery Services
            </h1>
            <p className="text-xl mb-8 text-foreground/80">
              Professional courier solutions with real-time tracking, secure handling, and guaranteed delivery.
            </p>

            {/* Tracking Search */}
            <div className="bg-card p-6 rounded-lg shadow-lg border border-primary/20">
              <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4">
                Track Your Package
              </h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1 border-primary/30 focus:border-primary"
                  onKeyPress={(e) => e.key === "Enter" && handleTrackPackage()}
                />
                <Button
                  onClick={handleTrackPackage}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Track
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Hero Image (replace truck icon with real image) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-lg overflow-hidden shadow-lg border-4 border-primary/20">
              <Image
                src="/images/truck-hero.png" // Replace this with your real truck/delivery image
                alt="SwiftCourier Truck"
                width={600}
                height={400}
                className="object-cover w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solutions / Services */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-card-foreground mb-4">
            Our Courier Solutions
          </h2>
          <p className="text-xl text-card-foreground/70 max-w-2xl mx-auto">
            Tailored services to match your business needs — fast, secure, and customer-focused.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Clock,
              title: "Real-Time Tracking",
              description: "Monitor packages every step of the way with GPS and instant updates.",
            },
            {
              icon: Shield,
              title: "Secure Handling",
              description: "Insurance and strong handling protocols protect your goods.",
            },
            {
              icon: MapPin,
              title: "Wide Coverage",
              description: "Local, regional, and international shipping routes.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-primary/20">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-xl font-heading">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center mb-12">
          <h2 className="text-4xl font-heading font-bold mb-4 text-foreground">
            Industries We Serve
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            From retail to pharmaceuticals, SwiftCourier supports businesses across industries with tailored solutions.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              img: "/images/industries/retail.jpg",
              title: "Retail",
              description: "Fast and flexible delivery for eCommerce and retail businesses.",
            },
            {
              img: "/images/industries/auto.jpg",
              title: "Automotive",
              description: "Efficient shipping for spare parts and automotive supply chains.",
            },
            {
              img: "/images/industries/pharma.jpg",
              title: "Pharmaceutical",
              description: "Temperature-controlled and secure handling for medical goods.",
            },
            {
              img: "/images/industries/tech.jpg",
              title: "Technology",
              description: "Reliable transport for sensitive electronics and IT equipment.",
            },
          ].map((industry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-primary/20"
            >
              <Image
                src={industry.img}
                alt={industry.title}
                width={400}
                height={250}
                className="object-contain w-full h-32 p-4 bg-white"
              />
              <div className="p-6">
                <h3 className="text-xl font-heading font-semibold mb-2 text-primary">{industry.title}</h3>
                <p className="text-foreground/80">{industry.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Global Offices", value: "30+" },
            { label: "Active Routes", value: "150+" },
            { label: "Deliveries / Year", value: "10M+" },
            { label: "Support Availability", value: "24/7" },
          ].map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-lg text-foreground/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              Ready to Ship?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands who trust SwiftCourier for fast, secure, and reliable delivery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ship">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg">
                  Ship Now
                </Button>
              </Link>
              <Link href="/calculate">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                >
                  Calculate Rates
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  )
}