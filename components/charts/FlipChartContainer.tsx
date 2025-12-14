"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UrbanCarbonScatter } from './UrbanCarbonScatter'
import { RenewableEnergyArea } from './RenewableEnergyArea'
import type { DataRecord } from '@/lib/loadData'

interface FlipChartContainerProps {
  data: DataRecord[]
}

export function FlipChartContainer({ data }: FlipChartContainerProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="flip-container relative w-full" style={{ minHeight: '600px' }}>
      <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
        {/* Front side - Urban Carbon Scatter */}
        <div className="flip-card-front">
          <div className="relative">
            <div className="relative">
              <UrbanCarbonScatter data={data} />
              <Button
                onClick={() => setIsFlipped(true)}
                className="absolute top-20 right-6 z-20"
                variant="outline"
                size="sm"
              >
                View Renewable Energy Chart →
              </Button>
            </div>
          </div>
        </div>

        {/* Back side - Renewable Energy Area */}
        <div className="flip-card-back">
          <div className="relative">
            <div className="relative">
              <RenewableEnergyArea data={data} />
              <Button
                onClick={() => setIsFlipped(false)}
                className="absolute top-20 right-6 z-20"
                variant="outline"
                size="sm"
              >
                ← View Carbon Damage Chart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

