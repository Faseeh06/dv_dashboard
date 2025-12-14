"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import * as d3 from 'd3'
import type { DataRecord } from '@/lib/loadData'

interface PeaceParadoxProps {
  data: DataRecord[]
}

interface ScatterPoint {
  urbanPopPerc: number
  overallScore: number
  country: string
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ScatterPoint
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <div className="text-sm font-semibold text-popover-foreground mb-1">
          {data.country}
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>Urban: {data.urbanPopPerc.toFixed(1)}%</div>
          <div>Peace Index: {data.overallScore.toFixed(2)}</div>
        </div>
      </div>
    )
  }
  return null
}

export function PeaceParadox({ data }: PeaceParadoxProps) {
  const analysis = useMemo(() => {
    // Get latest year data
    const years = data.map((d) => d.year).filter((y): y is number => y !== null)
    const latestYear = Math.max(...years, 0)

    // Filter valid data
    const validData = data.filter(
      (d) =>
        d.year === latestYear &&
        d.urbanPopPerc != null &&
        !isNaN(d.urbanPopPerc) &&
        d.overallScore != null &&
        !isNaN(d.overallScore) &&
        d.clusterLabel
    )

    if (validData.length === 0) {
      return {
        global: [],
        stable: [],
        volatile: [],
        globalCorr: 0,
        stableCorr: 0,
        volatileCorr: 0,
      }
    }

    // Categorize by cluster (Stable vs Volatile)
    const stableData = validData.filter(
      (d) =>
        d.clusterLabel === 'Rich/Stable' ||
        d.clusterLabel === 'Cluster 0' ||
        d.clusterLabel.includes('Stable')
    )
    const volatileData = validData.filter(
      (d) =>
        d.clusterLabel === 'Developing/Volatile' ||
        d.clusterLabel === 'Cluster 1' ||
        d.clusterLabel.includes('Volatile')
    )

    // Prepare scatter data
    const globalPoints: ScatterPoint[] = validData.map((d) => ({
      urbanPopPerc: d.urbanPopPerc!,
      overallScore: d.overallScore!,
      country: d.country,
    }))

    const stablePoints: ScatterPoint[] = stableData.map((d) => ({
      urbanPopPerc: d.urbanPopPerc!,
      overallScore: d.overallScore!,
      country: d.country,
    }))

    const volatilePoints: ScatterPoint[] = volatileData.map((d) => ({
      urbanPopPerc: d.urbanPopPerc!,
      overallScore: d.overallScore!,
      country: d.country,
    }))

    // Calculate correlations
    const calculateCorrelation = (points: ScatterPoint[]): number => {
      if (points.length < 2) return 0
      const x = points.map((p) => p.urbanPopPerc)
      const y = points.map((p) => p.overallScore)
      const n = points.length
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
      )

      return denominator === 0 ? 0 : numerator / denominator
    }

    const globalCorr = calculateCorrelation(globalPoints)
    const stableCorr = calculateCorrelation(stablePoints)
    const volatileCorr = calculateCorrelation(volatilePoints)

    return {
      global: globalPoints,
      stable: stablePoints,
      volatile: volatilePoints,
      globalCorr,
      stableCorr,
      volatileCorr,
    }
  }, [data])

  if (analysis.global.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">The Peace Paradox</CardTitle>
          <CardDescription className="text-muted-foreground">
            No data available
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Calculate regression lines
  const calculateRegression = (points: ScatterPoint[]) => {
    if (points.length < 2) return { slope: 0, intercept: 0 }
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.urbanPopPerc, 0)
    const sumY = points.reduce((sum, p) => sum + p.overallScore, 0)
    const sumXY = points.reduce((sum, p) => sum + p.urbanPopPerc * p.overallScore, 0)
    const sumX2 = points.reduce((sum, p) => sum + p.urbanPopPerc * p.urbanPopPerc, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const minX = Math.min(...points.map((p) => p.urbanPopPerc))
    const maxX = Math.max(...points.map((p) => p.urbanPopPerc))

    return {
      slope,
      intercept,
      x1: minX,
      x2: maxX,
      y1: slope * minX + intercept,
      y2: slope * maxX + intercept,
    }
  }

  const globalReg = calculateRegression(analysis.global)
  const stableReg = calculateRegression(analysis.stable)
  const volatileReg = calculateRegression(analysis.volatile)

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-xl font-bold text-foreground">
          The Peace Paradox — Global Stats Hide the Developing-World Crisis
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1">
          Simpson&apos;s Paradox: Urbanization improves peace in rich nations but worsens it in volatile ones
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 1: Global View */}
          <div className="space-y-2">
            <div className="text-center">
              <h3 className="text-sm font-bold mb-1" style={{ color: '#b6ed7a' }}>
                GLOBAL VIEW (All Countries)
              </h3>
              <p className="text-xs text-muted-foreground">
                The Illusion: r = {analysis.globalCorr.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(210, 210, 210, 0.3)" />
                  <XAxis
                    dataKey="urbanPopPerc"
                    name="Urban Population"
                    unit="%"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{
                      value: 'Urban Population (%)',
                      position: 'insideBottom',
                      offset: -5,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    dataKey="overallScore"
                    name="Peace Index"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{
                      value: 'Global Peace Index',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={analysis.global} fill="#b6ed7a" opacity={0.5}>
                    {analysis.global.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#b6ed7a" />
                    ))}
                  </Scatter>
                  <ReferenceLine
                    segment={[
                      { x: globalReg.x1, y: globalReg.y1 },
                      { x: globalReg.x2, y: globalReg.y2 },
                    ]}
                    stroke="#9bdf57"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="p-2 rounded text-xs text-center" style={{ backgroundColor: 'rgba(182, 237, 122, 0.15)' }}>
              <p className="text-muted-foreground">
                Misleading: Urbanization appears slightly beneficial
              </p>
            </div>
          </div>

          {/* Panel 2: Stable Urbanizers */}
          <div className="space-y-2">
            <div className="text-center">
              <h3 className="text-sm font-bold mb-1" style={{ color: '#7fc341' }}>
                STABLE URBANIZERS
              </h3>
              <p className="text-xs text-muted-foreground">
                Works as Expected: r = {analysis.stableCorr.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(210, 210, 210, 0.3)" />
                  <XAxis
                    dataKey="urbanPopPerc"
                    name="Urban Population"
                    unit="%"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{
                      value: 'Urban Population (%)',
                      position: 'insideBottom',
                      offset: -5,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    dataKey="overallScore"
                    name="Peace Index"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={analysis.stable} fill="#7fc341" opacity={0.6}>
                    {analysis.stable.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#7fc341" />
                    ))}
                  </Scatter>
                  <ReferenceLine
                    segment={[
                      { x: stableReg.x1, y: stableReg.y1 },
                      { x: stableReg.x2, y: stableReg.y2 },
                    ]}
                    stroke="#7fc341"
                    strokeWidth={2.5}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="p-2 rounded text-xs text-center" style={{ backgroundColor: 'rgba(127, 195, 65, 0.15)' }}>
              <p className="text-muted-foreground">
                n = {analysis.stable.length} obs • Cities → Peace (The &quot;German Model&quot;)
              </p>
            </div>
          </div>

          {/* Panel 3: Volatile Urbanizers */}
          <div className="space-y-2">
            <div className="text-center">
              <h3 className="text-sm font-bold mb-1" style={{ color: '#9bdf57' }}>
                VOLATILE URBANIZERS
              </h3>
              <p className="text-xs text-muted-foreground">
                ⚠️ THE CRISIS: r = {analysis.volatileCorr.toFixed(3)}
              </p>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(210, 210, 210, 0.3)" />
                  <XAxis
                    dataKey="urbanPopPerc"
                    name="Urban Population"
                    unit="%"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    label={{
                      value: 'Urban Population (%)',
                      position: 'insideBottom',
                      offset: -5,
                      style: { fill: 'hsl(var(--foreground))', fontSize: 10 },
                    }}
                  />
                  <YAxis
                    dataKey="overallScore"
                    name="Peace Index"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter data={analysis.volatile} fill="#9bdf57" opacity={0.6}>
                    {analysis.volatile.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#9bdf57" />
                    ))}
                  </Scatter>
                  <ReferenceLine
                    segment={[
                      { x: volatileReg.x1, y: volatileReg.y1 },
                      { x: volatileReg.x2, y: volatileReg.y2 },
                    ]}
                    stroke="#9bdf57"
                    strokeWidth={2.5}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="p-2 rounded text-xs text-center border" style={{ backgroundColor: 'rgba(155, 223, 87, 0.15)', borderColor: 'rgba(155, 223, 87, 0.3)' }}>
              <p className="text-muted-foreground">
                n = {analysis.volatile.length} obs • Cities → CONFLICT (Urbanization trap)
              </p>
            </div>
          </div>
        </div>

        {/* Statistics and Policy Implications */}
        <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/30">
          <div className="text-sm font-semibold text-foreground mb-3">
            Policy Implications
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <div className="font-medium text-foreground mb-1">
                Stable Urbanizers (r = {analysis.stableCorr.toFixed(2)})
              </div>
              <div>Cities + Strong Institutions = Peace</div>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">
                Volatile Urbanizers (r = {analysis.volatileCorr.toFixed(2)})
              </div>
              <div>Cities + Weak Governance = Conflict</div>
            </div>
            <div>
              <div className="font-medium text-foreground mb-1">
                Gap: {Math.abs(analysis.volatileCorr - analysis.stableCorr).toFixed(2)}
              </div>
              <div>Institutions matter MORE than urbanization itself</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <strong className="text-foreground">Action:</strong> Stop funding &apos;hardware&apos;
            (roads/buildings) without &apos;software&apos; (policing, courts, governance).
            Infrastructure loans MUST be paired with institutional capacity-building.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

