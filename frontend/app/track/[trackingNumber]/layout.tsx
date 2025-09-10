import type React from "react"
import { RealTimeNotifications } from "@/components/RealTimeNotifications"

export default function TrackingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { trackingNumber: string }
}) {
  return (
    <>
      {children}
      <RealTimeNotifications trackingNumber={params.trackingNumber} />
    </>
  )
}
