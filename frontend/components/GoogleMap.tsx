"use client"

import { useEffect, useRef } from "react"
import type { google } from "googlemaps"

interface MapMarker {
  position: {
    lat: number
    lng: number
  }
  title: string
  info?: string
}

interface GoogleMapProps {
  center: {
    lat: number
    lng: number
  }
  markers?: MapMarker[]
  zoom?: number
  className?: string
}

export function GoogleMap({ center, markers = [], zoom = 13, className = "" }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return

      // Initialize map
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f5f5f5" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
        ],
      })

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []

      // Add markers
      markers.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map: mapInstanceRef.current,
          title: markerData.title,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#FFD700" stroke="#000000" strokeWidth="2"/>
                <circle cx="16" cy="16" r="4" fill="#000000"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
          },
        })

        if (markerData.info) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: system-ui, sans-serif;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${markerData.title}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">${markerData.info}</p>
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(mapInstanceRef.current, marker)
          })
        }

        markersRef.current.push(marker)
      })
    }

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
    }
  }, [center, markers, zoom])

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center)
    }
  }, [center])

  return <div ref={mapRef} className={className} />
}
