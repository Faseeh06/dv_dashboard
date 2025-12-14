"use client"

import {
  CartesianGrid,
  Label,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

type Props = {
  data: Array<{
    country: string
    year: number | null
    renEnergyConsPerc: number | null
    cleanCookingAccess: number | null
    urbanPopPerc: number | null
    clusterLabel: string
  }>
}

const colors = ['#7fc341', '#9bdf57', '#b6ed7a', '#e8fbd1', '#7fc341']

export function EnergyParadoxChart({ data }: Props) {
  const filtered = data
    .filter(
      (d) =>
        d.renEnergyConsPerc != null &&
        d.cleanCookingAccess != null &&
        d.urbanPopPerc != null
    )
    .map((d) => ({
      ...d,
      renEnergyConsPerc: Number(d.renEnergyConsPerc),
      cleanCookingAccess: Number(d.cleanCookingAccess),
      urbanPopPerc: Number(d.urbanPopPerc),
    }))

  const clusters = Array.from(
    new Set(filtered.map((d) => (d.clusterLabel || 'Unlabeled').trim()))
  )

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">The Energy Paradox</h2>
        <p className="text-sm text-muted-foreground">Renewables vs Clean Cooking</p>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="renEnergyConsPerc"
              name="Renewable Energy Consumption"
              unit="%"
            />
            <YAxis
              type="number"
              dataKey="cleanCookingAccess"
              name="Access to Clean Cooking Fuels"
              unit="%"
            />
            <ZAxis type="number" dataKey="urbanPopPerc" range={[40, 140]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number, key) => [value.toFixed(2), key]}
              labelFormatter={() => ''}
            />
            <Legend />
            <ReferenceLine
              y={95}
              stroke="#b91c1c"
              strokeDasharray="4 4"
              label={<Label position="insideTopLeft" value="Modern Standard (>95%)" fill="#b91c1c" />}
            />
            {clusters.map((cluster, idx) => (
              <Scatter
                key={cluster}
                name={cluster}
                data={filtered.filter((d) => (d.clusterLabel || 'Unlabeled') === cluster)}
                fill={colors[idx % colors.length]}
                stroke="#0f172a"
                strokeWidth={0.8}
                fillOpacity={0.65}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

