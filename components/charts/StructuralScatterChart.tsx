"use client"

import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: Array<{
    country: string
    year: number | null
    urbanPopPerc: number | null
    agValueAdded: number | null
    clusterLabel: string
  }>
}

const colors = ['#7fc341', '#9bdf57', '#b6ed7a', '#e8fbd1', '#7fc341']

export function StructuralScatterChart({ data }: Props) {
  const filtered = useMemo(
    () =>
      data
        .filter((d) => d.urbanPopPerc != null && d.agValueAdded != null)
        .map((d) => ({
          ...d,
          urbanPopPerc: Number(d.urbanPopPerc),
          agValueAdded: Number(d.agValueAdded),
        })),
    [data]
  )

  const trend = useMemo(() => computeTrend(filtered), [filtered])

  const clusters = Array.from(new Set(filtered.map((d) => d.clusterLabel || 'Unlabeled')))

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Structural Transformation</h2>
        <p className="text-sm text-muted-foreground">Urbanization vs Agriculture</p>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="urbanPopPerc"
              name="Urban Population (%)"
              unit="%"
              tickCount={8}
            />
            <YAxis
              type="number"
              dataKey="agValueAdded"
              name="Agriculture Value Added (% of GDP)"
              unit="%"
              tickCount={8}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number, key) => [value.toFixed(2), key]}
              labelFormatter={(label) => `Urban population: ${label?.toFixed?.(2) ?? label}%`}
            />
            <Legend />
            {clusters.map((cluster, idx) => (
              <Scatter
                key={cluster}
                name={cluster}
                data={filtered.filter((d) => (d.clusterLabel || 'Unlabeled') === cluster)}
                fill={colors[idx % colors.length]}
              />
            ))}
            {trend && (
              <ReferenceLine
                segment={[
                  { x: trend.minX, y: trend.minY },
                  { x: trend.maxX, y: trend.maxY },
                ]}
                stroke="#9bdf57"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{ position: 'top', value: 'Trend' }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function computeTrend(
  points: Array<{ urbanPopPerc: number; agValueAdded: number }>
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (!points.length) return null

  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.urbanPopPerc, 0)
  const sumY = points.reduce((acc, p) => acc + p.agValueAdded, 0)
  const sumXY = points.reduce((acc, p) => acc + p.urbanPopPerc * p.agValueAdded, 0)
  const sumX2 = points.reduce((acc, p) => acc + p.urbanPopPerc * p.urbanPopPerc, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1)
  const intercept = (sumY - slope * sumX) / n

  const xs = points.map((p) => p.urbanPopPerc)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)

  return {
    minX,
    maxX,
    minY: slope * minX + intercept,
    maxY: slope * maxX + intercept,
  }
}

