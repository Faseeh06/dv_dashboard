"use client"

import { Card } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle: string
  gradient: string
}

export function StatCard({ title, value, subtitle, gradient }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-card to-card/50 border-${gradient}/30 hover:border-${gradient}/50 transition-all hover:scale-105 duration-200 cursor-pointer`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
          <div className={`w-2 h-2 rounded-full bg-${gradient} animate-pulse`}></div>
        </div>
        <div className="space-y-2">
          <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground font-light">{subtitle}</p>
        </div>
      </div>
    </Card>
  )
}

export function DashboardHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-1.5 h-16 bg-gradient-to-b from-[#7fc341] via-[#9bdf57] to-[#b6ed7a] rounded-full"></div>
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-3 bg-gradient-to-r from-[#7fc341] via-[#9bdf57] to-[#b6ed7a] bg-clip-text text-transparent leading-tight">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-4xl leading-relaxed font-light">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SectionHeader({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-4 border-l-4 border-[#7fc341] pl-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-base md:text-lg text-muted-foreground pl-4 leading-relaxed font-light max-w-4xl">
        {description}
      </p>
    </div>
  )
}
