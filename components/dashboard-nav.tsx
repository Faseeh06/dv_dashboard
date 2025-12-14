"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'

const sections = [
  { id: 'overview', label: 'Global Overview' },
  { id: 'crime', label: 'Crime & Safety' },
  { id: 'environment', label: 'Environment' },
  { id: 'security', label: 'Security' },
  { id: 'analysis', label: 'Deep Dive' },
]

export function DashboardNav() {
  const [activeSection, setActiveSection] = useState('overview')

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Card className="sticky top-4 bg-card/95 backdrop-blur-sm border-border/50 shadow-lg">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-[#7fc341] to-[#9bdf57] rounded-full"></span>
          Quick Navigation
        </h3>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-[#7fc341]/20 to-[#9bdf57]/20 text-foreground font-medium border border-[#7fc341]/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-6 pt-4 border-t border-border/30">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7fc341] animate-pulse"></div>
              <span>Live Dashboard</span>
            </div>
            <div className="text-xs opacity-70">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
