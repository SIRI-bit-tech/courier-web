"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, ChevronDown, ChevronUp, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"
import { Footer } from "@/components/Footer"
import Link from "next/link"

const faqs = [
  {
    question: "How do I track my package?",
    answer:
      "You can track your package by entering your tracking number on our homepage or visiting the tracking page directly. You'll get real-time updates on your package location and delivery status.",
  },
  {
    question: "What are your delivery timeframes?",
    answer:
      "Standard delivery takes 2-5 business days, Express delivery takes 1-2 business days, and Same-day delivery is available in select cities for orders placed before 2 PM.",
  },
  {
    question: "How much does shipping cost?",
    answer:
      "Shipping costs depend on package size, weight, distance, and delivery speed. Use our rate calculator on the homepage to get an instant quote for your shipment.",
  },
  {
    question: "What items cannot be shipped?",
    answer:
      "We cannot ship hazardous materials, illegal substances, perishable items without proper packaging, firearms, or items prohibited by local laws.",
  },
  {
    question: "Is my package insured?",
    answer:
      "All packages include basic insurance coverage up to $100. Additional insurance is available for high-value items at checkout.",
  },
  {
    question: "Can I change my delivery address?",
    answer:
      "You can change your delivery address before the package is out for delivery. Contact our customer support or use your account dashboard to make changes.",
  },
  {
    question: "What if my package is damaged or lost?",
    answer:
      "If your package is damaged or lost, please contact our customer support immediately. We'll investigate and provide compensation according to our insurance policy.",
  },
  {
    question: "Do you offer international shipping?",
    answer:
      "Yes, we offer international shipping to over 50 countries. International delivery times and costs vary by destination.",
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-12">
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto text-balance">
              Find answers to common questions about our delivery services
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-primary/20">
                <CardHeader>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => toggleFAQ(index)}
                  >
                    <CardTitle className="text-left text-lg">{faq.question}</CardTitle>
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-primary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-primary" />
                    )}
                  </Button>
                </CardHeader>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0">
                      <p className="text-gray-600 text-pretty">{faq.answer}</p>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Contact Support</Button>
            </Link>
          </div>
        </motion.div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  )
}