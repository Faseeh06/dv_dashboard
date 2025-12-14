"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UrbanCarbonScatter } from './UrbanCarbonScatter'
import { RenewableEnergyArea } from './RenewableEnergyArea'
import type { DataRecord } from '@/lib/loadData'
import { IconArrowsExchange } from '@tabler/icons-react'

interface ChartFlipCardProps {
  data: DataRecord[]
}

export function ChartFlipCard({ data }: ChartFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="relative w-full perspective-1000" style={{ minHeight: '600px' }}>
      {/* Flip Button - positioned relative to the card */}
      <div className="absolute top-4 right-4 z-30">
        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm border-border/50 shadow-lg hover:bg-background/95"
        >
          <IconArrowsExchange className="w-4 h-4 mr-2" />
          {isFlipped ? 'Show Carbon Damage' : 'Show Renewable Energy'}
        </Button>
      </div>

      {/* Flip Container */}
      <div
        className="relative w-full transform-style-preserve-3d transition-transform duration-700 ease-in-out"
        style={{
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Card - Urban Carbon Scatter */}
        <div
          className="w-full backface-hidden"
          style={{
            transform: 'rotateY(0deg)',
          }}
        >
          <UrbanCarbonScatter data={data} />
        </div>

        {/* Back Card - Renewable Energy Area */}
        <div
          className="absolute top-0 left-0 w-full backface-hidden"
          style={{
            transform: 'rotateY(180deg)',
          }}
        >
          <RenewableEnergyArea data={data} />
        </div>
      </div>
    </div>
  )
}

