"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CrimeHeatmapProps {
  data: Array<{
    giniCoefficient: number | null
    urbanPopPerc: number | null
    perceptionsOfCriminality: number | null
    homicideRate: number | null
    violentCrime: number | null
    violentDemonstrations: number | null
    accessToSmallArms: number | null
    safetyAndSecurity: number | null
  }>
}

function calculateTertiles(values: number[]): { low: number; mid: number; high: number } {
  const sorted = [...values].sort((a, b) => a - b)
  const low = sorted[Math.floor(sorted.length / 3)]
  const mid = sorted[Math.floor((sorted.length * 2) / 3)]
  const high = sorted[sorted.length - 1]
  return { low, mid, high }
}

function getTertileLabel(value: number, tertiles: { low: number; mid: number; high: number }, type: 'inequality' | 'urban'): string {
  if (value <= tertiles.low) {
    return type === 'inequality' ? 'Low inequality' : 'Low urban'
  } else if (value <= tertiles.mid) {
    return type === 'inequality' ? 'Mid inequality' : 'Mid urban'
  } else {
    return type === 'inequality' ? 'High inequality' : 'High urban'
  }
}

export function CrimeHeatmap({ data }: CrimeHeatmapProps) {
  const [selectedIndicator, setSelectedIndicator] = useState(0)
  const [hoveredCell, setHoveredCell] = useState<{
    rowLabel: string
    colLabel: string
    value: number
    x: number
    y: number
  } | null>(null)

  const indicatorMap = [
    { label: 'Perceptions of criminality', key: 'perceptionsOfCriminality' as const },
    { label: 'Homicide rate', key: 'homicideRate' as const },
    { label: 'Violent crime', key: 'violentCrime' as const },
    { label: 'Violent demonstrations', key: 'violentDemonstrations' as const },
    { label: 'Access to small arms', key: 'accessToSmallArms' as const },
    { label: 'Safety & security (higher = less safe)', key: 'safetyAndSecurity' as const },
  ]

  const heatmapData = useMemo(() => {
    // Filter out null/undefined values, but allow 0
    const validData = data.filter(
      (d) =>
        d.giniCoefficient != null &&
        !isNaN(d.giniCoefficient) &&
        d.urbanPopPerc != null &&
        !isNaN(d.urbanPopPerc) &&
        d[indicatorMap[selectedIndicator].key] != null &&
        !isNaN(d[indicatorMap[selectedIndicator].key] as number)
    )

    if (validData.length === 0) {
      console.log('No valid data found for heatmap', {
        totalRecords: data.length,
        selectedIndicator: indicatorMap[selectedIndicator].key,
        sampleRecord: data[0],
      })
      return null
    }

    // Calculate tertiles
    const giniValues = validData.map((d) => d.giniCoefficient!).filter((v) => !isNaN(v))
    const urbanValues = validData.map((d) => d.urbanPopPerc!).filter((v) => !isNaN(v))

    const giniTertiles = calculateTertiles(giniValues)
    const urbanTertiles = calculateTertiles(urbanValues)

    // Create 3x3 grid
    const rowOrder = ['Low inequality', 'Mid inequality', 'High inequality']
    const colOrder = ['Low urban', 'Mid urban', 'High urban']

    const grid: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    const counts: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]

    validData.forEach((d) => {
      const giniLabel = getTertileLabel(d.giniCoefficient!, giniTertiles, 'inequality')
      const urbanLabel = getTertileLabel(d.urbanPopPerc!, urbanTertiles, 'urban')

      const rowIdx = rowOrder.indexOf(giniLabel)
      const colIdx = colOrder.indexOf(urbanLabel)

      if (rowIdx >= 0 && colIdx >= 0) {
        const value = d[indicatorMap[selectedIndicator].key] as number
        if (!isNaN(value)) {
          grid[rowIdx][colIdx] += value
          counts[rowIdx][colIdx] += 1
        }
      }
    })

    // Calculate means
    const means = grid.map((row, i) =>
      row.map((sum, j) => (counts[i][j] > 0 ? sum / counts[i][j] : 0))
    )

    // Find min and max for color scaling
    const allValues = means.flat().filter(v => v > 0)
    const minValue = allValues.length > 0 ? Math.min(...allValues) : 0
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1

    // Transform to Recharts format
    const chartData = rowOrder.map((rowLabel, rowIdx) => {
      const row: Record<string, string | number> = { inequality: rowLabel }
      colOrder.forEach((colLabel, colIdx) => {
        row[colLabel] = means[rowIdx][colIdx]
      })
      return row
    })

    return {
      chartData,
      colOrder,
      rowOrder,
      minValue,
      maxValue,
    }
  }, [data, selectedIndicator])

  // Color interpolation function - red gradient for violence-related data
  const getColor = (value: number, min: number, max: number): string => {
    if (value === 0 || max === min) return 'hsl(0, 0%, 8%)'
    const ratio = (value - min) / (max - min)
    
    // Red gradient: light red → medium red → dark red
    // #ff6b6b → #ee5a52 → #dc2626 (light to dark red)
    if (ratio < 0.5) {
      // #ff6b6b to #ee5a52
      const t = ratio / 0.5
      return interpolateColor('#ff6b6b', '#ee5a52', t)
    } else {
      // #ee5a52 to #dc2626
      const t = (ratio - 0.5) / 0.5
      return interpolateColor('#ee5a52', '#dc2626', t)
    }
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

  const getTextColor = (value: number, min: number, max: number): string => {
    if (value === 0 || max === min) return '#94a3b8'
    const ratio = (value - min) / (max - min)
    // Use white text for better contrast on darker reds, lighter text on lighter reds
    return ratio > 0.3 ? '#ffffff' : '#f1f5f9'
  }

  if (!heatmapData) {
    const sampleData = data.length > 0 ? data[0] : null
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Crime & Safety Heatmap</CardTitle>
          <CardDescription className="text-muted-foreground">
            No data available. Total records: {data.length}
            {sampleData && (
              <div className="mt-2 text-xs">
                Sample: Gini={sampleData.giniCoefficient}, Urban={sampleData.urbanPopPerc}, 
                {indicatorMap[selectedIndicator].key}={sampleData[indicatorMap[selectedIndicator].key]}
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { chartData, colOrder, rowOrder, minValue, maxValue } = heatmapData

  // Create cells for heatmap
  const cells: Array<{
    value: number
    color: string
    rowLabel: string
    colLabel: string
  }> = []

  rowOrder.forEach((rowLabel, rowIdx) => {
    colOrder.forEach((colLabel, colIdx) => {
      const value = chartData[rowIdx][colLabel] as number
      cells.push({
        value,
        color: getColor(value, minValue, maxValue),
        rowLabel,
        colLabel,
      })
    })
  })

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 border-b border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              Crime & Safety Heatmap
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {indicatorMap[selectedIndicator].label} by Inequality & Urbanization Levels
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">
              Indicator:
            </label>
            <select
              value={selectedIndicator}
              onChange={(e) => setSelectedIndicator(Number(e.target.value))}
              className="px-4 py-2 bg-background border border-border/50 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
            >
              {indicatorMap.map((indicator, idx) => (
                <option key={idx} value={idx}>
                  {indicator.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">

        <div className="w-full flex justify-center py-4">
          <div className="inline-block">
            {/* Table-based heatmap with square cells */}
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="bg-background/98 backdrop-blur-sm border-r border-border/50 px-4 py-3 text-left text-sm font-bold text-foreground">
                    Inequality ↓ / Urbanization →
                  </th>
                  {colOrder.map((label) => (
                    <th
                      key={label}
                      className="border-b border-border/50 px-4 py-3 text-center text-sm font-semibold text-foreground bg-background/60 w-36 h-36"
                      style={{ verticalAlign: 'middle' }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowOrder.map((rowLabel, rowIdx) => (
                  <tr key={rowLabel} className="hover:bg-background/20 transition-colors">
                    <td className="bg-background/98 backdrop-blur-sm border-r border-border/50 px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap h-36">
                      {rowLabel}
                    </td>
                    {colOrder.map((colLabel, colIdx) => {
                      const cell = cells.find(
                        (c) => c.rowLabel === rowLabel && c.colLabel === colLabel
                      )
                      if (!cell) return null
                      const isHovered =
                        hoveredCell?.rowLabel === rowLabel &&
                        hoveredCell?.colLabel === colLabel
                      return (
                        <td
                          key={colLabel}
                          className={`border-2 border-black text-center text-sm font-medium transition-all cursor-pointer w-36 h-36 ${
                            isHovered ? 'ring-2 ring-primary/60 scale-105 z-30 relative' : ''
                          }`}
                          style={{
                            backgroundColor: cell.color,
                            color: getTextColor(cell.value, minValue, maxValue),
                            verticalAlign: 'middle',
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setHoveredCell({
                              rowLabel: cell.rowLabel,
                              colLabel: cell.colLabel,
                              value: cell.value,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            })
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {cell.value > 0 ? cell.value.toFixed(2) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Hover Tooltip */}
          {hoveredCell && (
            <div
              className="fixed bg-popover border border-border rounded-lg p-3 shadow-xl z-50 pointer-events-none"
              style={{
                left: `${hoveredCell.x}px`,
                top: `${hoveredCell.y}px`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-10px',
              }}
            >
              <div className="text-sm font-semibold text-popover-foreground mb-1">
                {indicatorMap[selectedIndicator].label}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Inequality: {hoveredCell.rowLabel}</div>
                <div>Urbanization: {hoveredCell.colLabel}</div>
                <div className="pt-1 border-t border-border/50 mt-1">
                  <span className="font-semibold text-popover-foreground">
                    Value: {hoveredCell.value.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color scale legend */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Low</span>
            <div className="flex items-center gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <div
                  key={ratio}
                  className="w-8 h-4 rounded border border-border/30"
                  style={{
                    background: getColor(
                      minValue + (maxValue - minValue) * ratio,
                      minValue,
                      maxValue
                    ),
                  }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Range: {minValue.toFixed(2)} - {maxValue.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

