"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { type ArcData, type CountryPoint } from '@/lib/globeArcs'
import { type GlobeConfig } from '@/components/ui/globe'

const World = dynamic(() => import('@/components/ui/globe').then((m) => m.World), {
  ssr: false,
})

interface WorldGlobeSectionProps {
  arcsData: ArcData[]
  globeConfig: GlobeConfig
  countryPoints: CountryPoint[]
}

export function WorldGlobeSection({ arcsData, globeConfig, countryPoints }: WorldGlobeSectionProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleCountryClick = (countryName: string, event: MouseEvent) => {
    setSelectedCountry(countryName)
    setTooltipPos({ x: event.clientX, y: event.clientY })
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="relative w-full h-[600px] md:h-[800px] overflow-hidden rounded-lg border bg-background">
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <h2 className="text-center text-3xl md:text-5xl font-bold text-foreground mb-4">
            Global Connections
          </h2>
          <p className="text-center text-base md:text-lg text-muted-foreground max-w-md px-4">
            Click on any country marker to see details
          </p>
        </div>
        <div className="absolute w-full h-full">
          <World 
            data={arcsData} 
            globeConfig={globeConfig} 
            onCountryClick={handleCountryClick}
            countryPoints={countryPoints}
          />
        </div>
        <div className="absolute w-full bottom-0 inset-x-0 h-40 bg-gradient-to-b pointer-events-none select-none from-transparent to-background z-20" />
        
        {selectedCountry && (
          <div
            className="fixed z-50"
            style={{
              left: `${tooltipPos.x + 15}px`,
              top: `${tooltipPos.y + 15}px`,
            }}
          >
            <div className="bg-popover text-popover-foreground px-4 py-2 rounded-md shadow-lg border text-base font-semibold">
              {selectedCountry}
              <button
                onClick={() => setSelectedCountry(null)}
                className="ml-2 text-xs opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

