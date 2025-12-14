"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DataRecord } from '@/lib/loadData'

interface IndicatorComparisonBarProps {
  data: DataRecord[]
}

// Indicators to compare
const topIndicators = [
  'internalPeace',
  'politicalInstability',
  'ongoingConflict',
  'neighbouringCountriesRelations',
  'intensityOfInternalConflict',
] as const

// Higher is worse indicators
const higherIsWorse = [
  'internalPeace',
  'politicalInstability',
  'ongoingConflict',
  'neighbouringCountriesRelations',
  'intensityOfInternalConflict',
]

const indicatorLabels: Record<string, string> = {
  internalPeace: 'Internal Peace',
  politicalInstability: 'Political Instability',
  ongoingConflict: 'Ongoing Conflict',
  neighbouringCountriesRelations: 'Neighbouring Relations',
  intensityOfInternalConflict: 'Conflict Intensity',
}

export function IndicatorComparisonBar({ data }: IndicatorComparisonBarProps) {
  const chartData = useMemo(() => {
    // Get latest year data
    const years = data.map((d) => d.year).filter((y): y is number => y !== null)
    const latestYear = Math.max(...years, 0)

    // Filter valid data for latest year
    const validData = data.filter(
      (d) =>
        d.year === latestYear &&
        d.urbanPopPerc != null &&
        !isNaN(d.urbanPopPerc) &&
        topIndicators.some((ind) => d[ind] != null && !isNaN(d[ind]))
    )

    if (validData.length === 0) return { groups: [], minValues: {}, maxValues: {} }

    // Categorize by urbanization level using EXACT EDA methodology
    // Method: pd.cut() with bins=[-1, 50, 75, 101], right=True (right-inclusive)
    // Boundaries:
    //   Low:    -1 < urban_pop_perc ≤ 50.0
    //   Medium: 50.0 < urban_pop_perc ≤ 75.0  
    //   High:   75.0 < urban_pop_perc ≤ 101.0
    const categorizeUrban = (urban: number): string => {
      if (urban <= 50) return 'Low (<50%)'
      if (urban <= 75) return 'Medium (50-75%)'
      return 'High (>75%)'
    }

    // Calculate min/max for normalization
    const minValues: Record<string, number> = {}
    const maxValues: Record<string, number> = {}

    topIndicators.forEach((ind) => {
      const values = validData
        .map((d) => d[ind])
        .filter((v): v is number => v != null && !isNaN(v))
      if (values.length > 0) {
        minValues[ind] = Math.min(...values)
        maxValues[ind] = Math.max(...values)
      }
    })

    // Group data and calculate normalized averages
    // Using exact order from EDA: Low, Medium, High
    const groups = ['Low (<50%)', 'Medium (50-75%)', 'High (>75%)']
    const groupData = groups.map((group) => {
      const groupRecords = validData.filter(
        (d) => categorizeUrban(d.urbanPopPerc!) === group
      )

      // Fix TypeScript error: explicitly type to allow string for 'group' key
      const normalizedScores: Record<string, any> = { group }

      topIndicators.forEach((ind) => {
        const values = groupRecords
          .map((d) => d[ind])
          .filter((v): v is number => v != null && !isNaN(v))

        if (values.length > 0 && minValues[ind] !== maxValues[ind]) {
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length
          // Normalize to 0-1 (matching MinMaxScaler from EDA)
          normalizedScores[ind] =
            (avg - minValues[ind]) / (maxValues[ind] - minValues[ind])
        } else {
          // If no data for this group/indicator, set to 0
          // This ensures all groups appear in the chart
          normalizedScores[ind] = 0
        }
      })

      return normalizedScores
    })

    // ALWAYS return all 3 groups (matching EDA methodology)
    // Even if a group has no data, it will show as 0 bars
    return { groups: groupData, minValues, maxValues }
  }, [data])

  if (chartData.groups.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center gap-4 border-l-4 border-[#7fc341] pl-4">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Normalized Indicator Scores
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground mt-2 pl-4">
            No data available
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
          <div className="text-sm font-semibold text-popover-foreground mb-2">
            {label}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {payload.map((entry: any, idx: number) => (
              <div key={idx}>
                <span style={{ color: entry.color }}>●</span> {entry.name}:{' '}
                {entry.value.toFixed(3)}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-6 border-b border-border/30">
        <div className="flex items-center gap-4 border-l-4 border-[#7fc341] pl-4 mb-3">
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Normalized Indicator Scores by Urbanization Level
          </CardTitle>
        </div>
        <CardDescription className="text-base md:text-lg text-muted-foreground font-light pl-4">
          Countries grouped using EDA methodology: Low ≤50%, Medium 50-75%, High &gt;75%
        </CardDescription>
        <div className="mt-3 pl-4 text-xs text-muted-foreground">
          <span className="font-semibold">Method:</span> Fixed bins [-1, 50, 75, 101] with right-inclusive boundaries (pandas.cut equivalent)
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.groups}
              margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(210, 210, 210, 0.3)"
              />
              <XAxis
                dataKey="group"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                label={{
                  value: 'Urbanization Level',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
              />
              <YAxis
                domain={[0, 1.15]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                label={{
                  value: 'Normalized Average Score (0-1)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                    {indicatorLabels[value] || value}
                  </span>
                )}
              />
              {topIndicators.map((ind, idx) => {
                const colors = ['#7fc341', '#9bdf57', '#b6ed7a', '#e8fbd1', '#7fc341']
                return (
                  <Bar
                    key={ind}
                    dataKey={ind}
                    name={indicatorLabels[ind]}
                    fill={colors[idx % colors.length]}
                    opacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                )
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Methodology & Indicator interpretation */}
        <div className="mt-6 space-y-4">
          {/* Urbanization Grouping Methodology */}
          <div className="p-5 bg-gradient-to-br from-background/50 to-background/30 rounded-lg border-2 border-border/30">
            <div className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
              3-Tier Urbanization Classification
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#7fc341]/10 border border-[#7fc341]/30 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Low Urbanization
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: '#7fc341' }}>
                  &lt; 50%
                </div>
                <div className="text-xs text-muted-foreground">
                  -1 &lt; urban % ≤ 50
                </div>
              </div>
              <div className="p-4 bg-[#9bdf57]/10 border border-[#9bdf57]/30 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Medium Urbanization
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: '#9bdf57' }}>
                  50-75%
                </div>
                <div className="text-xs text-muted-foreground">
                  50 &lt; urban % ≤ 75
                </div>
              </div>
              <div className="p-4 bg-[#b6ed7a]/10 border border-[#b6ed7a]/30 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  High Urbanization
                </div>
                <div className="text-xl font-bold mb-1" style={{ color: '#b6ed7a' }}>
                  &gt; 75%
                </div>
                <div className="text-xs text-muted-foreground">
                  75 &lt; urban % ≤ 101
                </div>
              </div>
            </div>
          </div>

          {/* Indicator interpretation */}
          <div className="p-5 bg-background/50 rounded-lg border border-border/30">
            <div className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
              Indicator Interpretation
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {topIndicators.map((ind) => {
                const isHigherWorse = higherIsWorse.includes(ind)
                return (
                  <div key={ind} className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        isHigherWorse ? 'text-red-500' : 'text-green-500'
                      }`}
                    >
                      {isHigherWorse ? '↓' : '↑'}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                        {indicatorLabels[ind]}
                      </div>
                      <div className="text-muted-foreground">
                        {isHigherWorse ? 'lower = better' : 'higher = better'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

