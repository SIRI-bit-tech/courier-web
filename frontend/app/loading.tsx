"use client"

import { motion } from "framer-motion"
import { Package } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="relative">
          <Package className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">Loading SwiftCourier</h2>
        <p className="text-gray-600">Please wait while we prepare your experience...</p>
      </motion.div>
    </div>
  )
}