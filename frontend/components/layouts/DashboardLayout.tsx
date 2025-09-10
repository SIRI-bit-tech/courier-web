"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, X, User, LogOut, Home, Calculator, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SwiftCourierLogo } from "@/components/SwiftCourierLogo"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY

      // Only hide/show if we've scrolled more than 10px to prevent flickering
      if (Math.abs(currentScrollY - lastScrollY) < 10) {
        return
      }

      if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header immediately
        setIsVisible(false)
      } else {
        // Scrolling up - show header
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    const handleScroll = () => {
      controlNavbar()
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [lastScrollY])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Track Package", href: "/track", icon: SwiftCourierLogo }, // Changed to use logo
    { name: "Ship Package", href: "/ship", icon: Truck },
    { name: "Calculate Rate", href: "/calculate", icon: Calculator },
    { name: "Profile", href: "/profile", icon: User },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-card/95 backdrop-blur-md border-r border-border shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border">
            {/* Logo - Not clickable */}
            <div className="flex items-center">
              <SwiftCourierLogo className="h-16 w-auto" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-accent/10 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                {item.name === "Track Package" ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <SwiftCourierLogo className="h-6 w-auto" />
                  </div>
                ) : (
                  <item.icon className="h-4 w-4" />
                )}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-card lg:border-r lg:border-border">
        <div className="flex items-center p-4 border-b border-border">
          {/* Logo - Not clickable */}
          <div className="flex items-center">
            <SwiftCourierLogo className="h-8 w-auto" />
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-accent/10 transition-colors"
            >
              {item.name === "Track Package" ? (
                <div className="w-4 h-4 flex items-center justify-center">
                  <SwiftCourierLogo className="h-3 w-auto" />
                </div>
              ) : (
                <item.icon className="h-4 w-4" />
              )}
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div 
          className={`sticky top-0 z-40 bg-card border-b border-border transition-transform duration-300 ease-in-out ${
            isVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome back, {user?.first_name || user?.username}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}