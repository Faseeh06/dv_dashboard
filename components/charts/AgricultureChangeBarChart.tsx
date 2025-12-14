"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  data: Array<{
    country: string
    deltaAgriculture: number
    deltaUrban: number
  }>
}

export function AgricultureChangeBarChart({ data }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fast Modernizers</h2>
        <p className="text-sm text-muted-foreground">Agriculture change after urbanization surge</p>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(v) => v.toFixed(1)} />
            <YAxis type="category" dataKey="country" width={150} />
            <Tooltip formatter={(v: number) => v.toFixed(2)} />
            <Legend />
            <ReferenceLine x={0} stroke="#111" />
            <Bar dataKey="deltaAgriculture" name="Δ Agriculture share (p.p.)" fill="#7fc341">
              <LabelList
                dataKey="deltaAgriculture"
                position="right"
                formatter={(v: number) => v.toFixed(1)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

