"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock, Send, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

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
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">Contact Us</h1>
            <p className="text-xl text-foreground/80 max-w-2xl mx-auto text-balance">
              Get in touch with our team. We're here to help with all your delivery needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>Multiple ways to reach our customer support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Phone Support</div>
                      <div className="text-foreground/60">+1 (555) 123-4567</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Email Support</div>
                      <div className="text-foreground/60">support@swiftcourier.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Headquarters</div>
                      <div className="text-foreground/60">123 Delivery Street, Logistics City, LC 12345</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Clock className="h-6 w-6 text-primary" />
                    <div>
                      <div className="font-semibold">Business Hours</div>
                      <div className="text-foreground/60">24/7 Customer Support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  )
}