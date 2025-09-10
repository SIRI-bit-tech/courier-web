"use client"

import { useEffect, useRef } from "react"

interface MapMarker {
  position: {
    lat: number
    lng: number
  }
  title: string
  info?: string
}

interface OpenStreetMapProps {
  center: {
    lat: number
    lng: number
  }
  markers?: MapMarker[]
  zoom?: number
  className?: string
}

export function OpenStreetMap({ center, markers = [], zoom = 13, className = "" }: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return

      // Dynamically import Leaflet
      const L = (await import('leaflet')).default

      // Fix for default markers in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([center.lat, center.lng], zoom)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)

      // Clear existing markers
      markersRef.current.forEach((marker: any) => mapInstanceRef.current.removeLayer(marker))
      markersRef.current = []

      // Add markers
      markers.forEach((markerData) => {
        const marker = L.marker([markerData.position.lat, markerData.position.lng])
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${markerData.title}</b><br>${markerData.info || ''}`)

        markersRef.current.push(marker)
      })
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [center, markers, zoom])

  return <div ref={mapRef} className={className} style={{ height: '400px', width: '100%' }} />
}
