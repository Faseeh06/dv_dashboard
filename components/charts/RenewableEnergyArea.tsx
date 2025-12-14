"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts'
import type { DataRecord } from '@/lib/loadData'

interface RenewableEnergyAreaProps {
  data: DataRecord[]
}

interface YearlyData {
  year: number
  renewableEnergyPercent: number
  totalPopulation: number
}

export function RenewableEnergyArea({ data }: RenewableEnergyAreaProps) {
  const chartData = useMemo(() => {
    // Filter valid data
    const validData = data.filter(
      (d) =>
        d.year != null &&
        d.renEnergyConsPerc != null &&
        !isNaN(d.renEnergyConsPerc) &&
        d.totalPop != null &&
        !isNaN(d.totalPop) &&
        d.totalPop > 0
    )

    // Group by year and calculate weighted average
    const byYear = new Map<number, { renewable: number; population: number }[]>()

    validData.forEach((d) => {
      const year = d.year!
      if (!byYear.has(year)) {
        byYear.set(year, [])
      }
      byYear.get(year)!.push({
        renewable: d.renEnergyConsPerc!,
        population: d.totalPop!,
      })
    })

    // Calculate weighted average for each year
    const yearlyData: YearlyData[] = []
    for (const [year, records] of byYear.entries()) {
      const totalRenewableWeighted = records.reduce(
        (sum, r) => sum + r.renewable * r.population,
        0
      )
      const totalPopulation = records.reduce((sum, r) => sum + r.population, 0)
      const weightedAverage =
        totalPopulation > 0 ? totalRenewableWeighted / totalPopulation : 0

      yearlyData.push({
        year,
        renewableEnergyPercent: weightedAverage,
        totalPopulation,
      })
    }

    // Sort by year
    yearlyData.sort((a, b) => a.year - b.year)

    return yearlyData
  }, [data])

  if (chartData.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Renewable Energy Consumption Trajectory</CardTitle>
          <CardDescription className="text-muted-foreground">
            No data available
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Calculate y-axis range to emphasize trend (more focused)
  const values = chartData.map((d) => d.renewableEnergyPercent)
  const yMax = Math.max(...values)
  const yMin = Math.min(...values)
  const yRange = yMax - yMin
  // Reduced padding for better trend visibility (0.1 instead of 0.3)
  const yBottom = Math.max(0, yMin - yRange * 0.1)
  const yTop = yMax + yRange * 0.1

  // Calculate statistics
  const startValue = chartData[0].renewableEnergyPercent
  const endValue = chartData[chartData.length - 1].renewableEnergyPercent
  const totalGrowth = endValue - startValue
  const percentageChange = startValue > 0 ? ((endValue / startValue) - 1) * 100 : 0

  // Calculate year-over-year changes
  const yoyChanges = chartData.slice(1).map((d, idx) => ({
    year: d.year,
    change: d.renewableEnergyPercent - chartData[idx].renewableEnergyPercent,
  }))
  const avgYoyChange =
    yoyChanges.reduce((sum, d) => sum + d.change, 0) / yoyChanges.length
  const maxGrowth = Math.max(...yoyChanges.map((d) => d.change))
  const maxGrowthYear = yoyChanges.find((d) => d.change === maxGrowth)?.year

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as YearlyData
      const dataIndex = chartData.findIndex((d) => d.year === data.year)
      const prevData = dataIndex > 0 ? chartData[dataIndex - 1] : null
      
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
          <div className="text-sm font-semibold text-popover-foreground mb-2">
            {data.year}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium text-popover-foreground">
                Renewable Energy:
              </span>{' '}
              {data.renewableEnergyPercent.toFixed(2)}%
            </div>
            {prevData && (
              <div className="pt-1 border-t border-border/50 mt-1">
                <span className="text-xs">
                  Change from previous year:{' '}
                  <span className="font-semibold text-popover-foreground">
                    {(data.renewableEnergyPercent - prevData.renewableEnergyPercent).toFixed(2)} pp
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-xl font-bold text-foreground">
          Global Renewable Energy Consumption Trajectory (2008-2020)
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1">
          Percentage of Total Energy Consumption
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            >
              <defs>
                <linearGradient id="colorRenewable" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7fc341" stopOpacity={0.6} />
                  <stop offset="35%" stopColor="#9bdf57" stopOpacity={0.4} />
                  <stop offset="70%" stopColor="#b6ed7a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e8fbd1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(210, 210, 210, 0.3)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.3)', strokeWidth: 1 }}
                tickLine={false}
                label={{
                  value: 'Year',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
              />
              <YAxis
                domain={[yBottom, yTop]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: '#9bdf57', strokeWidth: 1 }}
                tickLine={false}
                label={{
                  value: 'Renewable Energy Consumption (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
                }}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="renewableEnergyPercent"
                stroke="#7fc341"
                strokeWidth={2.5}
                fill="url(#colorRenewable)"
                dot={{ fill: '#7fc341', strokeWidth: 1, stroke: 'white', r: 3 }}
                activeDot={{ r: 5, stroke: '#9bdf57', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/50 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Total Growth</div>
            <div className="text-2xl font-bold text-foreground">
              {totalGrowth > 0 ? '+' : ''}
              {totalGrowth.toFixed(2)} pp
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {percentageChange > 0 ? '+' : ''}
              {percentageChange.toFixed(1)}% change
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Average Annual Change</div>
            <div className="text-2xl font-bold text-foreground">
              {avgYoyChange > 0 ? '+' : ''}
              {avgYoyChange.toFixed(2)} pp
            </div>
            <div className="text-xs text-muted-foreground mt-1">per year</div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg border border-border/30">
            <div className="text-xs text-muted-foreground mb-1">Largest Increase</div>
            <div className="text-2xl font-bold text-foreground">
              +{maxGrowth.toFixed(2)} pp
            </div>
            <div className="text-xs text-muted-foreground mt-1">in {maxGrowthYear}</div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/30">
          <div className="text-sm font-semibold text-foreground mb-2">Summary</div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Starting Renewable Energy ({chartData[0].year}):{' '}
              <span className="text-foreground font-semibold">
                {startValue.toFixed(2)}%
              </span>
            </div>
            <div>
              Ending Renewable Energy ({chartData[chartData.length - 1].year}):{' '}
              <span className="text-foreground font-semibold">
                {endValue.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

