"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DataRecord } from '@/lib/loadData'
import { clusterCountries } from '@/lib/clustering'

interface UrbanCarbonScatterProps {
  data: DataRecord[]
}

interface ScatterDataPoint {
  country: string
  urbanPopPerc: number
  carbonDamage: number
  population: number
  clusterLabel: string
  x: number
  y: number
  z: number
  color: string
}

// Helper function to interpolate between two hex colors
const interpolateColor = (color1: string, color2: string, t: number): string => {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)
  
  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)
  
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  
  return `rgb(${r}, ${g}, ${b})`
}

// Color function for clusters - matching PeaceParadoxScatter colors
// Stable Urbanizers = lime green, Volatile Urbanizers = red
const getClusterColor = (clusterLabel: string): string => {
  if (!clusterLabel) return '#8884d8'
  
  // Normalize cluster label to handle variations
  const normalized = clusterLabel.toLowerCase().trim()
  
  // Stable Urbanizers - lime green color
  if (normalized === 'stable urbanizers' || normalized.includes('stable')) {
    return '#a3e635' // Lime green (matching the other chart)
  }
  // Volatile Urbanizers - red color
  if (normalized === 'volatile urbanizers' || normalized.includes('volatile')) {
    return '#ef4444' // Red (matching the other chart)
  }
  // Default fallback
  return '#8884d8'
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ScatterDataPoint
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <div className="text-sm font-semibold text-popover-foreground mb-2">
          {data.country}
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Urban: {data.urbanPopPerc.toFixed(1)}%</div>
          <div>Carbon damage: {data.carbonDamage.toFixed(2)}% of GNI</div>
          <div>Population: {data.population.toFixed(1)}M</div>
          <div className="pt-1 border-t border-border/50 mt-1">
            <span className="font-medium text-popover-foreground">
              {data.clusterLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}


export function UrbanCarbonScatter({ data }: UrbanCarbonScatterProps) {
  // Perform clustering once (same as PeaceParadoxScatter)
  const countryProfiles = useMemo(() => clusterCountries(data), [data])

  const scatterData = useMemo(() => {
    // Get latest year
    const years = data.map((d) => d.year).filter((y): y is number => y !== null)
    const latestYear = Math.max(...years, 0)

    // Filter for latest year and valid data
    const validData = data.filter(
      (d) =>
        d.year === latestYear &&
        d.urbanPopPerc != null &&
        !isNaN(d.urbanPopPerc) &&
        d.carbonDamage != null &&
        !isNaN(d.carbonDamage) &&
        d.totalPop != null &&
        !isNaN(d.totalPop)
    )

    // Convert population to millions and get cluster labels from clustering
    const processed = validData.map((d) => {
      // Get cluster label from the K-Means clustering (same as PeaceParadoxScatter)
      const profile = countryProfiles.get(d.country)
      const clusterLabel = profile?.clusterLabel || 'Volatile Urbanizers'
      
      return {
        country: d.country,
        urbanPopPerc: d.urbanPopPerc!,
        carbonDamage: d.carbonDamage!,
        population: d.totalPop! / 1e6,
        clusterLabel,
      }
    })

    // Calculate size scale - using square root for better visual distribution
    const populations = processed.map((d) => d.population)
    const sizeScale = populations.map((pop) => Math.sqrt(pop))
    const minSize = Math.min(...sizeScale, 1)
    const maxSize = Math.max(...sizeScale, 1)
    const sizeRange = maxSize - minSize || 1

    // Create scatter points with normalized sizes (smaller range: 4-20)
    const points: ScatterDataPoint[] = processed.map((d) => {
      const size = Math.sqrt(d.population)
      // Normalize to range 4-20 for smaller bubbles
      const normalizedSize = 4 + 16 * ((size - minSize) / sizeRange)
      return {
        country: d.country,
        urbanPopPerc: d.urbanPopPerc,
        carbonDamage: d.carbonDamage,
        population: d.population,
        clusterLabel: d.clusterLabel, // Use existing cluster label from data
        x: d.urbanPopPerc,
        y: d.carbonDamage,
        z: normalizedSize,
        color: getClusterColor(d.clusterLabel),
      }
    })

    // Group by cluster labels (Stable Urbanizers vs Volatile Urbanizers)
    const stableCluster = points.filter((p) => p.clusterLabel === 'Stable Urbanizers')
    const volatileCluster = points.filter((p) => p.clusterLabel === 'Volatile Urbanizers')
    
    // Use cluster names for grouping
    const grouped: Record<string, ScatterDataPoint[]> = {}
    if (stableCluster.length > 0) {
      grouped['Stable Urbanizers'] = stableCluster
    }
    if (volatileCluster.length > 0) {
      grouped['Volatile Urbanizers'] = volatileCluster
    }
    
    // Fallback: if no clusters matched, group all points together
    if (Object.keys(grouped).length === 0 && points.length > 0) {
      grouped['All Countries'] = points
    }

    const maxCarbon = Math.max(...points.map((p) => p.carbonDamage), 0)
    
    return { 
      points, 
      grouped, 
      latestYear, 
      maxUrban: Math.max(...points.map((p) => p.urbanPopPerc), 0),
      maxCarbon,
    }
  }, [data, countryProfiles])

  if (scatterData.points.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Urban Density vs Carbon Damage</CardTitle>
          <CardDescription className="text-muted-foreground">
            No data available for the latest year
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { points, grouped, latestYear, maxUrban, maxCarbon } = scatterData
  
  // Calculate custom ticks for axes
  const xTicks = [0, 20, 40, 60, 80, 100]
  const maxY = Math.ceil(maxCarbon)
  const yTicks = Array.from({ length: Math.floor(maxY / 2) + 1 }, (_, i) => i * 2).filter(t => t <= 12)
  
  // Calculate position for ultra-urban zone label
  const zoneEnd = maxUrban >= 80 ? Math.max(100, maxUrban + 2) : 100
  const zoneMid = (80 + zoneEnd) / 2
  const zoneMidPercent = (zoneMid / zoneEnd) * 100

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-lg font-bold text-foreground text-center">
          Urban Density vs Carbon Damage ({latestYear})
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1 text-sm text-center">
          Bubble size = Population (millions) | Colors represent development clusters
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[550px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 70, left: 70 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(210, 210, 210, 0.3)"
                vertical={true}
                horizontal={true}
              />
              
              {/* Shaded zone for ultra-urban countries (>80%) */}
              {maxUrban >= 80 && (
                <ReferenceArea
                  x1={80}
                  x2={Math.max(100, maxUrban + 2)}
                  stroke="none"
                  fill="rgba(135, 206, 250, 0.2)"
                  ifOverflow="extendDomain"
                />
              )}

              {/* Horizontal reference line at 2% caution threshold */}
              <ReferenceLine
                y={2.0}
                stroke="white"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={({ viewBox }: any) => {
                  if (maxUrban < 80) {
                    return (
                      <text
                        x={viewBox?.width ? viewBox.width - 10 : 0}
                        y={viewBox?.y ? viewBox.y - 5 : 0}
                        fill="white"
                        fontSize={11}
                        textAnchor="end"
                      >
                        2% of GNI caution threshold
                      </text>
                    )
                  }
                  // Position in ultra-urban zone (x between 85 and 100, or maxUrban if higher)
                  const xPosition = Math.max(85, Math.min(98, maxUrban > 100 ? maxUrban - 2 : 90))
                  const xDomain = Math.max(100, maxUrban + 2)
                  const xPercent = (xPosition / xDomain)
                  const chartWidth = viewBox?.width || 500
                  const xCoord = (viewBox?.x || 0) + (xPercent * chartWidth)
                  
                  return (
                    <text
                      x={xCoord}
                      y={viewBox?.y ? viewBox.y - 5 : 0}
                      fill="white"
                      fontSize={11}
                      textAnchor="middle"
                    >
                      2% of GNI caution threshold
                    </text>
                  )
                }}
              />

              <XAxis
                type="number"
                dataKey="x"
                name="Urban Population"
                unit="%"
                domain={[0, Math.max(100, maxUrban + 2)]}
                ticks={xTicks}
                allowDecimals={false}
                label={{
                  value: 'Urban Population (% of total)',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => Math.round(value).toString()}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                allowDataOverflow={true}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Carbon Damage"
                unit="% of GNI"
                domain={[0, 12]}
                ticks={yTicks}
                label={{
                  value: 'Carbon Damage (% of GNI)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={(value) => Math.round(value).toString()}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
              />
              <ZAxis
                type="number"
                dataKey="z"
                range={[4, 20]}
                name="Population"
                unit="M"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              {/* Render scatter points - colored by development cluster */}

              {/* Render scatter points - colored by development cluster */}
              {Object.keys(grouped).length > 0 ? (
                Object.entries(grouped).map(([clusterName, clusterPoints]) => (
                  <Scatter
                    key={clusterName}
                    name={clusterName}
                    data={clusterPoints}
                    fill={clusterPoints[0]?.color || '#8884d8'}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props
                      if (!cx || !cy || !payload) return null
                      // Use z value directly as radius (it's already normalized)
                      const radius = Math.max(payload.z || 6, 3)
                      // Use color from payload (based on cluster)
                      const color = payload.color || '#8884d8'
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill={color}
                          fillOpacity={0.7}
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      )
                    }}
                  />
                ))
              ) : (
                // Fallback: render all points as a single group if grouping failed
                <Scatter
                  name="All Countries"
                  data={points}
                  fill="#8884d8"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props
                    if (!cx || !cy || !payload) return null
                    const radius = Math.max(payload.z || 6, 3)
                    const color = payload.color || '#8884d8'
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={color}
                        fillOpacity={0.7}
                        stroke={color}
                        strokeWidth={1.5}
                      />
                    )
                  }}
                />
              )}

              {/* Cluster legend */}
              <Legend
                content={() => (
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="text-xs font-semibold text-foreground mb-1">Development Clusters</div>
                    <div className="flex flex-col gap-2">
                      {Object.keys(grouped).length > 0 ? (
                        Object.entries(grouped).map(([clusterName, clusterPoints]) => {
                          if (clusterPoints.length === 0) return null
                          const color = clusterPoints[0].color
                          return (
                            <div key={clusterName} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ background: color }}
                              />
                              <span className="text-xs text-muted-foreground">
                                {clusterName} ({clusterPoints.length} countries)
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-border/50"
                            style={{ background: '#8884d8' }}
                          />
                          <span className="text-xs text-muted-foreground">
                            All Countries ({points.length} countries)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {/* Custom label for ultra-urban zone - positioned absolutely at top center of zone */}
          {maxUrban >= 80 && (
            <div
              className="absolute text-xs font-medium"
              style={{
                left: `calc(70px + ${zoneMidPercent}% * (100% - 100px) / 100)`,
                top: '35px',
                transform: 'translateX(-50%)',
                color: 'rgba(70, 130, 180, 0.9)',
                pointerEvents: 'none',
              }}
            >
              
            </div>
          )}
        </div>

        {/* Statistics */}
        {points.filter((p) => p.urbanPopPerc >= 80).length > 0 && (
          <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/30">
            <div className="text-sm font-semibold text-foreground mb-3">
              Ultra-Urban Countries Analysis (&gt;80% urbanization) — {latestYear}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <div className="font-medium text-foreground mb-1">Summary</div>
                <div>
                  Total ultra-urban countries:{' '}
                  <span className="text-foreground font-semibold">
                    {points.filter((p) => p.urbanPopPerc >= 80).length}
                  </span>
                </div>
                <div className="mt-1">
                  {(
                    (points.filter((p) => p.urbanPopPerc >= 80 && p.carbonDamage <= 2).length /
                      Math.max(points.filter((p) => p.urbanPopPerc >= 80).length, 1)) *
                    100
                  ).toFixed(0)}
                  % keep carbon damage below 2% of GNI threshold
                </div>
              </div>
              <div>
                <div className="font-medium text-foreground mb-1">Average Carbon Damage</div>
                {Object.entries(grouped)
                  .filter(([_, clusterPoints]) => clusterPoints.filter((p) => p.urbanPopPerc >= 80).length > 0)
                  .map(([cluster, clusterPoints]) => {
                    const ultraUrban = clusterPoints.filter((p) => p.urbanPopPerc >= 80)
                    if (ultraUrban.length === 0) return null
                    const avg = ultraUrban.reduce((sum, p) => sum + p.carbonDamage, 0) / ultraUrban.length
                    return (
                      <div key={cluster} className="mt-1">
                        <span className="text-foreground font-medium">{cluster}</span> (ultra-urban):{' '}
                        <span className="text-foreground">{avg.toFixed(2)}%</span> of GNI
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

