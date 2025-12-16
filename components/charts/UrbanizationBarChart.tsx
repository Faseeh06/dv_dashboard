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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DataRecord } from '@/lib/loadData'

interface UrbanizationBarChartProps {
  data: DataRecord[]
}

interface IndicatorMapping {
  displayName: string
  csvKey: keyof DataRecord
}

// Indicator mapping matching the notebook
const indicatorMap: IndicatorMapping[] = [
  { displayName: 'violence score', csvKey: 'overallScore' },
  { displayName: 'ongoing conflict', csvKey: 'ongoingConflict' },
  { displayName: 'Political instability', csvKey: 'politicalInstability' },
  { displayName: 'intensity of internal conflict', csvKey: 'intensityOfInternalConflict' },
  { displayName: 'Instability_Index', csvKey: 'internalPeace' },
  { displayName: 'defense capacity', csvKey: 'militarisation' },
  { displayName: 'weapons exports', csvKey: 'weaponsExports' },
  { displayName: 'weapons imports', csvKey: 'weaponsImports' },
  { displayName: 'nuclear and heavy weapons', csvKey: 'nuclearHeavyWeapons' },
]

// "Higher is worse" indicators - when these increase, conditions worsen
const higherIsWorse = new Set([
  'Instability_Index',
  'ongoing conflict',
  'intensity of internal conflict',
  'Political instability',
  'violence score'
])

interface ChartDataPoint {
  indicator: string
  'Low Urbanization (<50%)': number
  'Medium Urbanization (50-75%)': number
  'High Urbanization (>75%)': number
}

export function UrbanizationBarChart({ data }: UrbanizationBarChartProps) {
  const chartData = useMemo(() => {
    // Filter valid data with all required fields
    const validData = data.filter(
      (d) =>
        d.urbanPopPerc != null &&
        !isNaN(d.urbanPopPerc) &&
        d.country &&
        d.country.trim() !== ''
    )

    if (validData.length === 0) return []

    // Step 1: Normalize the RAW data first (like sklearn's MinMaxScaler does)
    // For each indicator, find min/max across ALL rows, then normalize
    const normalizedRecords: Array<DataRecord & { urbanGroup: string }> = []
    
    // Calculate min/max for each indicator across all data
    const minMaxPerIndicator: Record<string, { min: number; max: number }> = {}
    
    indicatorMap.forEach((indicator) => {
      const allValues = validData
        .map((d) => d[indicator.csvKey])
        .filter((v) => v != null && !isNaN(v as number)) as number[]
      
      if (allValues.length > 0) {
        minMaxPerIndicator[indicator.displayName] = {
          min: Math.min(...allValues),
          max: Math.max(...allValues),
        }
      }
    })

    // Step 2: Normalize each row and assign to urban group
    validData.forEach((record) => {
      const urban = record.urbanPopPerc!
      let urbanGroup = ''
      
      if (urban < 50) {
        urbanGroup = 'Low Urbanization (<50%)'
      } else if (urban < 75) {
        urbanGroup = 'Medium Urbanization (50-75%)'
      } else {
        urbanGroup = 'High Urbanization (>75%)'
      }

      const normalizedRecord: any = { ...record, urbanGroup }

      // Normalize each indicator value for this record
      indicatorMap.forEach((indicator) => {
        const value = record[indicator.csvKey] as number
        const minMax = minMaxPerIndicator[indicator.displayName]
        
        if (value != null && !isNaN(value) && minMax) {
          const range = minMax.max - minMax.min
          if (range > 0) {
            normalizedRecord[indicator.csvKey] = (value - minMax.min) / range
          } else {
            normalizedRecord[indicator.csvKey] = 0.5
          }
        } else {
          normalizedRecord[indicator.csvKey] = null
        }
      })

      normalizedRecords.push(normalizedRecord)
    })

    // Step 3: Group by urbanization level and calculate averages of NORMALIZED values
    const groups: Record<string, { low: DataRecord[]; medium: DataRecord[]; high: DataRecord[] }> = {
      indicators: { low: [], medium: [], high: [] }
    }

    const groupedData: Record<string, number[]>[] = [
      {}, // Low
      {}, // Medium
      {} // High
    ]

    normalizedRecords.forEach((record) => {
      const groupIndex =
        record.urbanGroup === 'Low Urbanization (<50%)'
          ? 0
          : record.urbanGroup === 'Medium Urbanization (50-75%)'
          ? 1
          : 2

      indicatorMap.forEach((indicator) => {
        const value = record[indicator.csvKey] as number
        if (value != null && !isNaN(value)) {
          if (!groupedData[groupIndex][indicator.displayName]) {
            groupedData[groupIndex][indicator.displayName] = []
          }
          groupedData[groupIndex][indicator.displayName].push(value)
        }
      })
    })

    // Step 4: Calculate averages for each group
    const chartData: ChartDataPoint[] = indicatorMap.map((indicator) => {
      const lowValues = groupedData[0][indicator.displayName] || []
      const mediumValues = groupedData[1][indicator.displayName] || []
      const highValues = groupedData[2][indicator.displayName] || []

      return {
        indicator: indicator.displayName,
        'Low Urbanization (<50%)':
          lowValues.length > 0 ? lowValues.reduce((a, b) => a + b, 0) / lowValues.length : 0,
        'Medium Urbanization (50-75%)':
          mediumValues.length > 0 ? mediumValues.reduce((a, b) => a + b, 0) / mediumValues.length : 0,
        'High Urbanization (>75%)':
          highValues.length > 0 ? highValues.reduce((a, b) => a + b, 0) / highValues.length : 0,
      }
    })

    return chartData
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
          <div className="text-sm font-semibold text-popover-foreground mb-2">
            {label}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index}>
                <span className="font-medium text-popover-foreground">{entry.name}:</span>{' '}
                {entry.value.toFixed(3)}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomXAxisTick = ({ x, y, payload }: any) => {
    // Split long labels into multiple lines (max 20 chars per line)
    const words = payload.value.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    words.forEach((word: string) => {
      if ((currentLine + word).length > 20) {
        if (currentLine) lines.push(currentLine.trim())
        currentLine = word + ' '
      } else {
        currentLine += word + ' '
      }
    })
    if (currentLine) lines.push(currentLine.trim())
    
    return (
      <g transform={`translate(${x},${y})`}>
        {/* Multi-line label */}
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={15 + index * 12}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={10}
          >
            {line}
          </text>
        ))}
      </g>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Comparison of Normalized Indicator Scores by Urbanization Level</CardTitle>
          <CardDescription className="text-muted-foreground">
            No data available
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-xl font-bold text-foreground">
          Comparison of Normalized Indicator Scores by Urbanization Level
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1">
          Each indicator is normalized independently to 0-1 scale.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 30, bottom: 100, left: 70 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(127, 195, 65, 0.2)"
                vertical={false}
              />
              <XAxis
                dataKey="indicator"
                height={90}
                tick={<CustomXAxisTick />}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[0, 0.8]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                label={{
                  value: 'Normalized Average Score (0-1)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="Low Urbanization (<50%)"
                fill="#5a8f29"
                name="Low Urbanization (<50%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Medium Urbanization (50-75%)"
                fill="#7fc341"
                name="Medium Urbanization (50-75%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="High Urbanization (>75%)"
                fill="#b6ed7a"
                name="High Urbanization (>75%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
