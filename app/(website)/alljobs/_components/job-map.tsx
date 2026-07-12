"use client"

import { useEffect, useRef } from "react"

interface JobMapProps {
  location: string
}

export default function JobMap({ location }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Create a simple map placeholder with OpenStreetMap styling
    const mapContainer = mapRef.current
    mapContainer.innerHTML = `
      <div class="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
        <div class="relative z-10 text-center">
          <div class="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <p class="text-sm font-medium text-gray-700">${location}</p>
          <p class="text-xs text-gray-500 mt-1">Interactive map would load here</p>
        </div>
        <!-- Simulated map grid -->
        <div class="absolute inset-0 opacity-10">
          <div class="grid grid-cols-8 grid-rows-6 h-full w-full">
            ${Array.from({ length: 48 }, (_, i) => `<div class="border border-gray-300"></div>`).join("")}
          </div>
        </div>
        <!-- Simulated roads -->
        <div class="absolute top-1/3 left-0 right-0 h-0.5 bg-gray-400 opacity-30"></div>
        <div class="absolute top-2/3 left-0 right-0 h-0.5 bg-gray-400 opacity-30"></div>
        <div class="absolute left-1/4 top-0 bottom-0 w-0.5 bg-gray-400 opacity-30"></div>
        <div class="absolute left-3/4 top-0 bottom-0 w-0.5 bg-gray-400 opacity-30"></div>
      </div>
    `

    // In a real implementation, you would initialize an actual map here
    // For example, using Leaflet with OpenStreetMap:
    /*
    const map = L.map(mapContainer).setView([40.7128, -74.0060], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    
    // Geocode the location and add marker
    // This would require a geocoding service
    */
  }, [location])

  return (
    <div ref={mapRef} className="w-full">
      {/* Map will be rendered here */}
    </div>
  )
}
