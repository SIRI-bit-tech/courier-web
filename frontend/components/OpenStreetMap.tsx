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
  const isMountedRef = useRef(true)

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !isMountedRef.current) return

      try {
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default

        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Check if map already exists and is valid
        if (mapInstanceRef.current && mapInstanceRef.current._container) {
          // Update existing map instead of creating new one
          try {
            mapInstanceRef.current.setView([center.lat, center.lng], zoom)
            
            // Clear existing markers safely
            markersRef.current.forEach((marker: any) => {
              if (marker && mapInstanceRef.current && mapInstanceRef.current.hasLayer && mapInstanceRef.current.hasLayer(marker)) {
                mapInstanceRef.current.removeLayer(marker)
              }
            })
            markersRef.current = []

            // Add new markers
            markers.forEach((markerData) => {
              if (mapInstanceRef.current && mapInstanceRef.current._container) {
                const marker = L.marker([markerData.position.lat, markerData.position.lng])
                  .addTo(mapInstanceRef.current)
                  .bindPopup(`<b>${markerData.title}</b><br>${markerData.info || ''}`)

                markersRef.current.push(marker)
              }
            })
          } catch (error) {
            // If updating fails, recreate the map
            console.warn('Failed to update map, recreating:', error)
            if (mapInstanceRef.current && mapInstanceRef.current.remove) {
              mapInstanceRef.current.remove()
            }
            mapInstanceRef.current = null
            // Fall through to create new map
          }
        }

        // Create new map if it doesn't exist or failed to update
        if (!mapInstanceRef.current || !mapInstanceRef.current._container) {
          // Initialize new map
          mapInstanceRef.current = L.map(mapRef.current).setView([center.lat, center.lng], zoom)

          // Add reliable map tiles (Stadia Maps)
          L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20,
            minZoom: 0,
          }).addTo(mapInstanceRef.current)

          // Clear existing markers
          markersRef.current.forEach((marker: any) => {
            if (marker && mapInstanceRef.current && mapInstanceRef.current.hasLayer && mapInstanceRef.current.hasLayer(marker)) {
              mapInstanceRef.current.removeLayer(marker)
            }
          })
          markersRef.current = []

          // Add markers
          markers.forEach((markerData) => {
            if (mapInstanceRef.current && mapInstanceRef.current._container) {
              const marker = L.marker([markerData.position.lat, markerData.position.lng])
                .addTo(mapInstanceRef.current)
                .bindPopup(`<b>${markerData.title}</b><br>${markerData.info || ''}`)

              markersRef.current.push(marker)
            }
          })
        }
      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    initMap()

    return () => {
      isMountedRef.current = false
      
      // Comprehensive cleanup
      try {
        // Remove all markers safely
        markersRef.current.forEach((marker: any) => {
          if (marker && marker.remove) {
            try {
              marker.remove()
            } catch (e) {
              // Ignore marker removal errors
            }
          }
        })
        markersRef.current = []

        // Remove map safely
        if (mapInstanceRef.current && mapInstanceRef.current.remove) {
          try {
            mapInstanceRef.current.remove()
          } catch (e) {
            // Ignore map removal errors
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      
      mapInstanceRef.current = null
    }
  }, [center.lat, center.lng, markers, zoom])

  return <div ref={mapRef} className={className} style={{ height: '400px', width: '100%' }} />
}