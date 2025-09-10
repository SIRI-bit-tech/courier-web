import { Suspense } from "react"
import { AdminDashboard } from "@/components/dashboards/AdminDashboard"

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading admin dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  )
}
