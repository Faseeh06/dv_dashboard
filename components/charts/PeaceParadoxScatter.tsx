"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  Line,
  ComposedChart,
} from 'recharts'
import type { DataRecord } from '@/lib/loadData'
import { clusterCountries, type CountryProfile } from '@/lib/clustering'

interface PeaceParadoxScatterProps {
  data: DataRecord[]
}

interface IndicatorOption {
  label: string
  key: keyof CountryProfile
}

// Indicator options matching the bar chart
const indicatorOptions: IndicatorOption[] = [
  { label: 'Militarization_Index', key: 'militarisation' },
  { label: 'nuclear and heavy weapons', key: 'nuclearHeavyWeapons' },
  { label: 'overall score', key: 'overallScore' },
  { label: 'ongoing conflict', key: 'ongoingConflict' },
  { label: 'Instability_Index', key: 'internalPeace' },
]

interface ScatterPoint {
  country: string
  x: number
  y: number
  cluster: string
}

// Linear regression
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

// Calculate correlation
function calculateCorrelation(points: { x: number; y: number }[]): number {
  if (points.length < 2) return 0
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumYY = points.reduce((sum, p) => sum + p.y * p.y, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))
  
  return denominator !== 0 ? numerator / denominator : 0
}

export function PeaceParadoxScatter({ data }: PeaceParadoxScatterProps) {
  const [selectedIndicator, setSelectedIndicator] = useState(2) // 'overall score'

  // Perform clustering once
  const countryProfiles = useMemo(() => clusterCountries(data), [data])

  const scatterData = useMemo(() => {
    const indicator = indicatorOptions[selectedIndicator]
    if (!indicator || countryProfiles.size === 0) {
      return { 
        allPoints: [], 
        stablePoints: [], 
        volatilePoints: [],
        allTrend: null,
        stableTrend: null,
        volatileTrend: null,
        correlations: { global: 0, stable: 0, volatile: 0 }
      }
    }

    // Create scatter points from profiles
    const allPoints: ScatterPoint[] = []
    const stablePoints: ScatterPoint[] = []
    const volatilePoints: ScatterPoint[] = []

    countryProfiles.forEach((profile) => {
      const value = profile[indicator.key] as number
      if (value != null && !isNaN(value) && profile.urbanPopPerc != null && !isNaN(profile.urbanPopPerc)) {
        const point = {
          country: profile.country,
          x: profile.urbanPopPerc,
          y: value,
          cluster: profile.clusterLabel,
        }
        allPoints.push(point)
        if (profile.clusterLabel === 'Stable Urbanizers') {
          stablePoints.push(point)
        } else {
          volatilePoints.push(point)
        }
      }
    })

    if (allPoints.length === 0) {
      return { 
        allPoints: [], 
        stablePoints: [], 
        volatilePoints: [],
        allTrend: null,
        stableTrend: null,
        volatileTrend: null,
        correlations: { global: 0, stable: 0, volatile: 0 }
      }
    }

    // Calculate trendlines
    const minX = Math.min(...allPoints.map(p => p.x)) - 5
    const maxX = Math.max(...allPoints.map(p => p.x)) + 5

    let allTrend = null
    let stableTrend = null
    let volatileTrend = null

    if (allPoints.length >= 2) {
      const { slope, intercept } = linearRegression(allPoints)
      allTrend = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
      ]
    }

    if (stablePoints.length >= 2) {
      const { slope, intercept } = linearRegression(stablePoints)
      stableTrend = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
      ]
    }

    if (volatilePoints.length >= 2) {
      const { slope, intercept } = linearRegression(volatilePoints)
      volatileTrend = [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
      ]
    }

    // Calculate correlations
    const correlations = {
      global: calculateCorrelation(allPoints),
      stable: calculateCorrelation(stablePoints),
      volatile: calculateCorrelation(volatilePoints),
    }

    return { allPoints, stablePoints, volatilePoints, allTrend, stableTrend, volatileTrend, correlations }
  }, [countryProfiles, selectedIndicator])

  // Custom tooltip for each chart
  const createCustomTooltip = (clusterType: 'global' | 'stable' | 'volatile') => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload as ScatterPoint
        const { correlations } = scatterData
        const correlation = clusterType === 'global' ? correlations.global : 
                           clusterType === 'stable' ? correlations.stable : correlations.volatile
        return (
          <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
            <div className="text-sm font-semibold text-popover-foreground mb-2">
              {data.country}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Urban: <span className="font-semibold text-popover-foreground">{data.x.toFixed(1)}%</span>
              </div>
              <div>
                Score: <span className="font-semibold text-popover-foreground">{data.y.toFixed(2)}</span>
              </div>
              <div className="pt-1 border-t border-border/50 mt-1">
                <span className="font-medium text-popover-foreground">{data.cluster}</span>
              </div>
              <div className="pt-2 border-t border-border/50 mt-2 text-xs">
                <div className="font-semibold text-popover-foreground">
                  Correlation: r = {correlation >= 0 ? '+' : ''}{correlation.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        )
      }
      return null
    }
  }

  if (scatterData.allPoints.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4 border-l-4 border-[#7fc341] pl-4">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Correlation Analysis
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground mt-2 pl-4">No data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { allPoints, stablePoints, volatilePoints, allTrend, stableTrend, volatileTrend, correlations } = scatterData

  // Check if current indicator is "overall score" or "ongoing conflict" and determine colors
  const currentKey = indicatorOptions[selectedIndicator].key
  const isOverallScore = currentKey === 'overallScore'
  const isOngoingConflict = currentKey === 'ongoingConflict'
  const isInstabilityIndex = currentKey === 'internalPeace'
  
  // For overall score: negative correlation = good (green), positive = bad (red)
  // Each cluster gets its own color based on ITS correlation
  // For ongoing conflict and instability index: volatile countries are always red
  const globalColor = isOverallScore && correlations.global > 0 ? '#DC0000' : '#b6ed7a'
  const stableColor = isOverallScore && correlations.stable > 0 ? '#DC0000' : '#7fc341'
  const volatileColor = (isOngoingConflict || isInstabilityIndex) ? '#DC0000' : (isOverallScore && correlations.volatile > 0 ? '#DC0000' : '#9bdf57')

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-6 border-b border-border/30">
        <div className="flex items-center gap-4 border-l-4 border-[#7fc341] pl-4 mb-3">
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {indicatorOptions[selectedIndicator].label}
          </CardTitle>
        </div>
        <CardDescription className="text-base md:text-lg text-muted-foreground font-light pl-4">
          Examining the relationship between urbanization and peace indicators across country clusters
        </CardDescription>
        <div className="mt-3 pl-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ backgroundColor: `${globalColor}1A`, borderWidth: '1px', borderStyle: 'solid', borderColor: `${globalColor}4D` }}>
            <span className="text-sm font-semibold text-foreground">Global Correlation:</span>
            <span className="text-sm font-mono font-bold" style={{ color: globalColor }}>
              r = {correlations.global >= 0 ? '+' : ''}{correlations.global.toFixed(3)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-3 block uppercase tracking-wide">
            Select Indicator:
          </label>
          <select
            value={selectedIndicator}
            onChange={(e) => setSelectedIndicator(Number(e.target.value))}
            className="w-full px-4 py-3 bg-background border-2 border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-[#7fc341]/50 focus:border-[#7fc341] text-base font-medium transition-all"
          >
            {indicatorOptions.map((indicator, idx) => (
              <option key={idx} value={idx}>
                {indicator.label}
              </option>
            ))}
          </select>
        </div>

        {/* Three Scatter Plots Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: All Countries (Global View) */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-base font-bold mb-1" style={{ color: globalColor }}>
                GLOBAL VIEW
              </h3>
              <p className="text-xs text-muted-foreground">
                All Countries: r = {correlations.global >= 0 ? '+' : ''}{correlations.global.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 10, bottom: 50, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${globalColor}33`} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value)}`}
                    label={{
                      value: 'Urban %',
                      position: 'insideBottom',
                      offset: -8,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                    label={{
                      value: 'Score',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <Tooltip content={createCustomTooltip('global')} cursor={{ strokeDasharray: '3 3' }} />
                  
                  {/* Global trendline */}
                  {allTrend && allTrend.length === 2 && (
                    <Line
                      data={allTrend}
                      type="linear"
                      dataKey="y"
                      stroke={globalColor}
                      strokeWidth={2.5}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}

                  {/* All points */}
                  {allPoints.length > 0 && (
                    <Scatter
                      name="All Countries"
                      data={allPoints}
                      fill={globalColor}
                      shape="circle"
                    >
                      {allPoints.map((entry, index) => (
                        <Cell key={`all-${index}`} fill={globalColor} fillOpacity={0.6} />
                      ))}
                    </Scatter>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 rounded text-xs text-center" style={{ backgroundColor: `${globalColor}26` }}>
              <p className="text-muted-foreground">
                n = {allPoints.length} countries
              </p>
            </div>
          </div>

          {/* Chart 2: Stable Urbanizers */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-base font-bold mb-1" style={{ color: stableColor }}>
                STABLE URBANIZERS
              </h3>
              <p className="text-xs text-muted-foreground">
                Correlation: r = {correlations.stable >= 0 ? '+' : ''}{correlations.stable.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 10, bottom: 50, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${stableColor}33`} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value)}`}
                    label={{
                      value: 'Urban %',
                      position: 'insideBottom',
                      offset: -8,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip content={createCustomTooltip('stable')} cursor={{ strokeDasharray: '3 3' }} />
                  
                  {/* Stable trendline */}
                  {stableTrend && stableTrend.length === 2 && (
                    <Line
                      data={stableTrend}
                      type="linear"
                      dataKey="y"
                      stroke={stableColor}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  )}

                  {/* Stable points */}
                  {stablePoints.length > 0 && (
                    <Scatter
                      name="Stable Urbanizers"
                      data={stablePoints}
                      fill={stableColor}
                      shape="circle"
                    >
                      {stablePoints.map((entry, index) => (
                        <Cell key={`stable-${index}`} fill={stableColor} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 rounded text-xs text-center" style={{ backgroundColor: `${stableColor}26` }}>
              <p className="text-muted-foreground">
                n = {stablePoints.length} countries
              </p>
            </div>
          </div>

          {/* Chart 3: Volatile Urbanizers */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-base font-bold mb-1" style={{ color: volatileColor }}>
                VOLATILE URBANIZERS
              </h3>
              <p className="text-xs text-muted-foreground">
                Correlation: r = {correlations.volatile >= 0 ? '+' : ''}{correlations.volatile.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 10, bottom: 50, left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={`${volatileColor}33`} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value)}`}
                    label={{
                      value: 'Urban %',
                      position: 'insideBottom',
                      offset: -8,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                    tickLine={false}
                    tickFormatter={(value) => value.toFixed(1)}
                  />
                  <Tooltip content={createCustomTooltip('volatile')} cursor={{ strokeDasharray: '3 3' }} />
                  
                  {/* Volatile trendline */}
                  {volatileTrend && volatileTrend.length === 2 && (
                    <Line
                      data={volatileTrend}
                      type="linear"
                      dataKey="y"
                      stroke={volatileColor}
                      strokeWidth={2.5}
                      dot={false}
                    />
                  )}

                  {/* Volatile points */}
                  {volatilePoints.length > 0 && (
                    <Scatter
                      name="Volatile Urbanizers"
                      data={volatilePoints}
                      fill={volatileColor}
                      shape="circle"
                    >
                      {volatilePoints.map((entry, index) => (
                        <Cell key={`volatile-${index}`} fill={volatileColor} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 rounded text-xs text-center border" style={{ backgroundColor: `${volatileColor}26`, borderColor: `${volatileColor}4D` }}>
              <p className="text-muted-foreground">
                n = {volatilePoints.length} countries
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 p-6 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-border/30">
          <div className="text-base font-bold text-foreground mb-4 uppercase tracking-wide">Correlation Analysis</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${stableColor}1A`, borderWidth: '1px', borderStyle: 'solid', borderColor: `${stableColor}4D` }}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stable Urbanizers</div>
              <div className="text-2xl font-bold mb-1" style={{ color: stableColor }}>
                r = {correlations.stable >= 0 ? '+' : ''}{correlations.stable.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">{stablePoints.length} countries</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${volatileColor}1A`, borderWidth: '1px', borderStyle: 'solid', borderColor: `${volatileColor}4D` }}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Volatile Urbanizers</div>
              <div className="text-2xl font-bold mb-1" style={{ color: volatileColor }}>
                r = {correlations.volatile >= 0 ? '+' : ''}{correlations.volatile.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">{volatilePoints.length} countries</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: `${globalColor}1A`, borderWidth: '1px', borderStyle: 'solid', borderColor: `${globalColor}4D` }}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Global Trend</div>
              <div className="text-2xl font-bold mb-1" style={{ color: globalColor }}>
                r = {correlations.global >= 0 ? '+' : ''}{correlations.global.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground">{allPoints.length} countries</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
