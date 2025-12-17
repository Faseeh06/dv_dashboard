"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { countryCoordinates } from '@/lib/countryCoordinates'
import type { DataRecord } from '@/lib/loadData'
import { Play, Pause, RotateCcw, FastForward, ChevronLeft, ChevronRight } from 'lucide-react'

interface GlobeGLViewerProps {
  data: DataRecord[]
}

// Heat map color interpolation
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

// Country name mapping
const countryNameMap: Record<string, string> = {
  'United States': 'United States of America',
  'USA': 'United States of America',
  'US': 'United States of America',
  'United States of America': 'United States of America',
  'United Kingdom': 'United Kingdom',
  'UK': 'United Kingdom',
  'Britain': 'United Kingdom',
  'Russia': 'Russia',
  'Russian Federation': 'Russia',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'Czech Rep.': 'Czechia',
  'Slovak Republic': 'Slovakia',
  'Slovakia': 'Slovakia',
  'Kyrgyz Republic': 'Kyrgyzstan',
  'Kyrgyzstan': 'Kyrgyzstan',
  'North Macedonia': 'North Macedonia',
  'Macedonia': 'North Macedonia',
  'Republic of Macedonia': 'North Macedonia',
  'Turkiye': 'Turkey',
  'Turkey': 'Turkey',
  'South Korea': 'South Korea',
  'Republic of Korea': 'South Korea',
  'Korea, South': 'South Korea',
  'North Korea': 'North Korea',
  'Democratic Republic of Korea': 'North Korea',
  'Korea, North': 'North Korea',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Dem. Rep. Congo': 'Dem. Rep. Congo',
  'Congo': 'Republic of the Congo',
  'Republic of Congo': 'Republic of the Congo',
  'Tanzania': 'United Republic of Tanzania',
  'United Republic of Tanzania': 'United Republic of Tanzania',
  'Laos': "Lao PDR",
  'Lao PDR': "Lao PDR",
  'Vietnam': 'Vietnam',
  'Viet Nam': 'Vietnam',
  'Myanmar': 'Myanmar',
  'Burma': 'Myanmar',
  'Ivory Coast': "Côte d'Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Côte d'Ivoire": "Côte d'Ivoire",
}

const normalizeCountryName = (name: string): string => {
  return countryNameMap[name] || name
}

type ViewMode = 'growth' | 'absolute' | 'cluster'

// Cluster colors (matching Correlation Deep Dive)
const CLUSTER_COLORS = {
  'Stable Urbanizers': '#7fc341',
  'Volatile Urbanizers': '#9bdf57',
  'Unknown': 'rgba(80, 80, 80, 0.6)',
}

// Monochromatic Heat Map: Blue for decline, Orange-Red gradient for growth
// Blue shades for negative, warm orange-red shades for positive
const getGrowthColor = (growthPercent: number): string => {
  // Clamp growth to realistic range: -30% to +150%
  const clampedGrowth = Math.max(-30, Math.min(150, growthPercent))
  
  if (clampedGrowth < 0) {
    // Negative growth: Blue shades (darker = worse decline)
    const ratio = (clampedGrowth + 30) / 30 // 0 to 1 (0 = -30%, 1 = 0%)
    // Light blue to dark blue
    return interpolateColor('#4682B4', '#1E3A8A', 1 - ratio)
  } else {
    // Positive growth: Warm color gradient (light orange → dark red)
    const ratio = clampedGrowth / 150 // 0 to 1 (0 = 0%, 1 = 150%)
    
    if (ratio < 0.2) {
      // Very light orange (0-30%)
      const t = ratio / 0.2
      return interpolateColor('#FED7AA', '#FDBA74', t)
    } else if (ratio < 0.4) {
      // Light orange to orange (30-60%)
      const t = (ratio - 0.2) / 0.2
      return interpolateColor('#FDBA74', '#FB923C', t)
    } else if (ratio < 0.6) {
      // Orange to dark orange (60-90%)
      const t = (ratio - 0.4) / 0.2
      return interpolateColor('#FB923C', '#F97316', t)
    } else if (ratio < 0.8) {
      // Dark orange to red-orange (90-120%)
      const t = (ratio - 0.6) / 0.2
      return interpolateColor('#F97316', '#EA580C', t)
    } else {
      // Red-orange to deep red (120-150%+)
      const t = (ratio - 0.8) / 0.2
      return interpolateColor('#EA580C', '#DC2626', Math.min(t, 1))
    }
  }
}

// Absolute GDP color using percentile within year (for relative comparison)
const getPercentileColor = (percentile: number): string => {
  // percentile is 0-100
  if (percentile < 10) {
    return interpolateColor('#0000AA', '#0066FF', percentile / 10)
  } else if (percentile < 25) {
    return interpolateColor('#0066FF', '#00BFFF', (percentile - 10) / 15)
  } else if (percentile < 50) {
    return interpolateColor('#00BFFF', '#00FF7F', (percentile - 25) / 25)
  } else if (percentile < 75) {
    return interpolateColor('#00FF7F', '#FFFF00', (percentile - 50) / 25)
  } else if (percentile < 90) {
    return interpolateColor('#FFFF00', '#FF8C00', (percentile - 75) / 15)
  } else {
    return interpolateColor('#FF8C00', '#FF0000', (percentile - 90) / 10)
  }
}

const formatGDP = (gdp: number): string => {
  if (gdp >= 1e12) return `$${(gdp / 1e12).toFixed(2)}T`
  if (gdp >= 1e9) return `$${(gdp / 1e9).toFixed(2)}B`
  if (gdp >= 1e6) return `$${(gdp / 1e6).toFixed(2)}M`
  return `$${gdp.toFixed(0)}`
}

const formatGrowth = (growth: number): string => {
  const sign = growth >= 0 ? '+' : ''
  return `${sign}${growth.toFixed(1)}%`
}

export function GlobeGLViewer({ data }: GlobeGLViewerProps) {
  const globeInstanceRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const countriesGeoJsonRef = useRef<any>(null)
  const isGlobeInitializedRef = useRef(false)
  
  const [selectedYear, setSelectedYear] = useState<number>(2008)
  const [viewMode, setViewMode] = useState<ViewMode>('growth')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1500)
  const [isGlobeReady, setIsGlobeReady] = useState(false)
  const playbackRef = useRef<NodeJS.Timeout | null>(null)

  // Get available years
  const availableYears = useMemo(() => {
    const years = data
      .map((d) => d.year)
      .filter((y): y is number => y !== null)
      .filter((y, idx, arr) => arr.indexOf(y) === idx)
      .sort((a, b) => a - b)
    return years.length > 0 ? years : [2020]
  }, [data])

  const baseYear = availableYears[0] // 2008

  // Precompute base year GDP for growth calculation
  const baseYearGDP = useMemo(() => {
    const baseData = data.filter(d => d.year === baseYear && d.gdp != null && d.gdp > 0)
    const map = new Map<string, number>()
    baseData.forEach(d => map.set(d.country, d.gdp!))
    return map
  }, [data, baseYear])

  // Precompute all year data with growth rates and percentiles
  const allYearsData = useMemo(() => {
    const yearDataMap = new Map<number, Map<string, any>>()
    
    availableYears.forEach(year => {
      const yearData = data.filter(
        (d) => d.year === year && d.gdp != null && !isNaN(d.gdp) && d.gdp > 0
      )
      
      // Calculate percentiles for this year
      const sortedGDP = yearData.map(d => d.gdp!).sort((a, b) => a - b)
      const getPercentile = (gdp: number): number => {
        const idx = sortedGDP.findIndex(g => g >= gdp)
        return (idx / sortedGDP.length) * 100
      }
      
      const countryMap = new Map<string, any>()
      
      yearData.forEach(record => {
        const coords = countryCoordinates[record.country]
        if (!coords) return
        
        const gdp = record.gdp!
        const baseGDP = baseYearGDP.get(record.country)
        
        // Calculate growth from base year
        let growthPercent = 0
        if (baseGDP && baseGDP > 0) {
          growthPercent = ((gdp - baseGDP) / baseGDP) * 100
        }
        
        // Calculate percentile within this year
        const percentile = getPercentile(gdp)
        
        // Get colors for all modes
        const growthColor = getGrowthColor(growthPercent)
        const percentileColor = getPercentileColor(percentile)
        const clusterLabel = record.clusterLabel || 'Unknown'
        const clusterColor = CLUSTER_COLORS[clusterLabel as keyof typeof CLUSTER_COLORS] || CLUSTER_COLORS['Unknown']
        
        countryMap.set(record.country, {
          ...record,
          growthPercent,
          percentile,
          growthColor,
          percentileColor,
          clusterColor,
          clusterLabel,
          baseGDP,
        })
      })
      
      yearDataMap.set(year, countryMap)
    })
    
    return yearDataMap
  }, [data, availableYears, baseYearGDP])

  // Get current year's country data
  const currentYearCountryData = useMemo(() => {
    return allYearsData.get(selectedYear) || new Map()
  }, [allYearsData, selectedYear])

  // Playback controls
  const startPlayback = useCallback(() => {
    if (playbackRef.current) clearInterval(playbackRef.current)
    setIsPlaying(true)
    
    playbackRef.current = setInterval(() => {
      setSelectedYear((prev) => {
        const currentIndex = availableYears.indexOf(prev)
        const nextIndex = (currentIndex + 1) % availableYears.length
        return availableYears[nextIndex]
      })
    }, playbackSpeed)
  }, [availableYears, playbackSpeed])

  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      clearInterval(playbackRef.current)
      playbackRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const resetPlayback = useCallback(() => {
    stopPlayback()
    setSelectedYear(availableYears[0])
  }, [availableYears, stopPlayback])

  const stepYear = useCallback((direction: 'prev' | 'next') => {
    stopPlayback()
    setSelectedYear((prev) => {
      const currentIndex = availableYears.indexOf(prev)
      if (direction === 'next') {
        return availableYears[Math.min(currentIndex + 1, availableYears.length - 1)]
      } else {
        return availableYears[Math.max(currentIndex - 1, 0)]
      }
    })
  }, [availableYears, stopPlayback])

  // Update playback when speed changes
  useEffect(() => {
    if (isPlaying) {
      startPlayback()
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current)
    }
  }, [playbackSpeed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current)
    }
  }, [])

  // Year statistics
  const yearStats = useMemo(() => {
    const countryData = Array.from(currentYearCountryData.values())
    if (countryData.length === 0) return null
    
    const gdpValues = countryData.map(d => d.gdp).filter(Boolean).sort((a: number, b: number) => a - b)
    const growthValues = countryData.map(d => d.growthPercent).filter((v): v is number => v !== undefined)
    
    const total = gdpValues.reduce((sum: number, v: number) => sum + v, 0)
    const avgGrowth = growthValues.length > 0 
      ? growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length 
      : 0
    const maxGrowth = growthValues.length > 0 ? Math.max(...growthValues) : 0
    const minGrowth = growthValues.length > 0 ? Math.min(...growthValues) : 0
    
    // Find top growers
    const topGrowers = countryData
      .filter(d => d.growthPercent !== undefined)
      .sort((a, b) => b.growthPercent - a.growthPercent)
      .slice(0, 3)
    
    // Count clusters
    const stableCount = countryData.filter(d => d.clusterLabel === 'Stable Urbanizers').length
    const volatileCount = countryData.filter(d => d.clusterLabel === 'Volatile Urbanizers').length
    
    return { 
      total, 
      avgGrowth, 
      maxGrowth, 
      minGrowth, 
      count: countryData.length,
      topGrowers,
      stableCount,
      volatileCount
    }
  }, [currentYearCountryData])

  // Initialize globe ONCE
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined' || isGlobeInitializedRef.current) return

    // @ts-ignore
    const Globe = require('globe.gl').default

    const globe = Globe()(containerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(containerRef.current.offsetWidth)
      .height(containerRef.current.offsetHeight)

    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3

    globeInstanceRef.current = globe
    isGlobeInitializedRef.current = true

    // Fetch GeoJSON once
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(countries => {
        countriesGeoJsonRef.current = countries
        setIsGlobeReady(true)
      })

    const handleResize = () => {
      if (containerRef.current && globe) {
        globe.width(containerRef.current.offsetWidth)
        globe.height(containerRef.current.offsetHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (globe._destructor) {
        globe._destructor()
      }
      isGlobeInitializedRef.current = false
    }
  }, [])

  // UPDATE polygon colors when year or viewMode changes
  useEffect(() => {
    if (!globeInstanceRef.current || !countriesGeoJsonRef.current || !isGlobeReady) return

    const globe = globeInstanceRef.current
    const countries = countriesGeoJsonRef.current

    // Update country data for current year
    countries.features.forEach((feat: any) => {
      const geoCountryName = feat.properties.NAME || feat.properties.name || feat.properties.ADMIN
      const normalizedGeoName = normalizeCountryName(geoCountryName)
      
      let countryData = currentYearCountryData.get(geoCountryName)
      if (!countryData) countryData = currentYearCountryData.get(normalizedGeoName)
      
      if (!countryData) {
        for (const [dataCountry, data] of currentYearCountryData.entries()) {
          const normalizedDataName = normalizeCountryName(dataCountry)
          if (normalizedDataName === normalizedGeoName || 
              normalizedDataName === geoCountryName ||
              dataCountry === normalizedGeoName) {
            countryData = data
            break
          }
        }
      }
      
      if (countryData) {
        feat.properties.gdp = countryData.gdp
        feat.properties.growthPercent = countryData.growthPercent
        feat.properties.percentile = countryData.percentile
        feat.properties.baseGDP = countryData.baseGDP
        feat.properties.clusterLabel = countryData.clusterLabel
        feat.properties.color = viewMode === 'growth' 
          ? countryData.growthColor 
          : viewMode === 'absolute' 
            ? countryData.percentileColor 
            : countryData.clusterColor
        feat.properties.urbanPopPerc = countryData.urbanPopPerc
        feat.properties.popDensSqKm = countryData.popDensSqKm
        feat.properties.totalPop = countryData.totalPop
        feat.properties.country = countryData.country
        feat.properties.year = selectedYear
      } else {
        feat.properties.gdp = null
        feat.properties.color = null
        feat.properties.country = null
        feat.properties.growthPercent = null
        feat.properties.clusterLabel = null
      }
    })

    globe
      .polygonsData(countries.features)
      .polygonAltitude(0.01)
      .polygonCapColor((feat: any) => feat.properties.color || 'rgba(50, 50, 50, 0.4)')
      .polygonSideColor(() => 'rgba(0, 0, 0, 0.15)')
      .polygonStrokeColor(() => '#222222')
      .polygonLabel((feat: any) => {
        const props = feat.properties
        if (!props.country || !props.gdp) return ''
        
        const gdpFormatted = formatGDP(props.gdp)
        const baseGDPFormatted = props.baseGDP ? formatGDP(props.baseGDP) : 'N/A'
        const growthFormatted = props.growthPercent !== undefined ? formatGrowth(props.growthPercent) : 'N/A'
        const popFormatted = props.totalPop ? `${(props.totalPop / 1e6).toFixed(2)}M` : 'N/A'
        const urbanFormatted = props.urbanPopPerc ? `${props.urbanPopPerc.toFixed(1)}%` : 'N/A'
        
        const growthColor = props.growthPercent >= 0 ? '#4ade80' : '#f87171'
        const clusterBadge = props.clusterLabel ? `
          <div style="
            display: inline-block;
            padding: 4px 12px;
            background: ${props.color};
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #000;
          ">
            ${props.clusterLabel}
          </div>
        ` : ''
        
        return `
          <div style="
            background: rgba(0, 0, 0, 0.92);
            color: white;
            padding: 14px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            min-width: 240px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            border-left: 4px solid ${props.color};
          ">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 10px; color: ${props.color};">
              ${props.country}
            </div>
            ${clusterBadge}
            <div style="
              display: inline-block;
              padding: 4px 12px;
              background: ${growthColor};
              border-radius: 4px;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 12px;
              color: #000;
            ">
              ${growthFormatted} since ${baseYear}
            </div>
            <div style="margin: 6px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">GDP (${selectedYear}):</span> 
              <span style="font-weight: 600;">${gdpFormatted}</span>
            </div>
            <div style="margin: 6px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">GDP (${baseYear}):</span> 
              <span style="font-weight: 600;">${baseGDPFormatted}</span>
            </div>
            <div style="margin: 6px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Population:</span> 
              <span style="font-weight: 600;">${popFormatted}</span>
            </div>
            <div style="margin: 6px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Urbanization:</span> 
              <span style="font-weight: 600;">${urbanFormatted}</span>
            </div>
            <div style="margin: 6px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Rank (percentile):</span> 
              <span style="font-weight: 600;">Top ${(100 - (props.percentile || 0)).toFixed(0)}%</span>
            </div>
          </div>
        `
      })

  }, [selectedYear, currentYearCountryData, isGlobeReady, viewMode, baseYear])

  const yearProgress = availableYears.length > 1 
    ? ((selectedYear - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100
    : 0

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardContent className="pt-6">
        {/* View Mode Toggle */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('growth')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'growth'
                ? 'bg-[#7fc341] text-black'
                : 'bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            GDP Growth (from {baseYear})
          </button>
          <button
            onClick={() => setViewMode('absolute')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'absolute'
                ? 'bg-[#7fc341] text-black'
                : 'bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            GDP Ranking (Percentile)
          </button>
          <button
            onClick={() => setViewMode('cluster')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'cluster'
                ? 'bg-[#7fc341] text-black'
                : 'bg-muted/50 text-foreground hover:bg-muted'
            }`}
          >
            Country Clusters
          </button>
        </div>

        {/* Playback Controls */}
        <div className="mb-6 p-4 bg-gradient-to-r from-background/80 to-background/60 rounded-xl border border-border/40">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Timeline ({baseYear} → {availableYears[availableYears.length - 1]})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-[#7fc341]">{selectedYear}</span>
                  {isPlaying && (
                    <span className="animate-pulse text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      PLAYING
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${yearProgress}%` }}
                />
                {availableYears.map((year, idx) => (
                  <button
                    key={year}
                    onClick={() => { stopPlayback(); setSelectedYear(year); }}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-background border-2 border-muted-foreground/50 hover:border-[#7fc341] hover:scale-125 transition-all cursor-pointer z-10"
                    style={{ 
                      left: `${(idx / (availableYears.length - 1)) * 100}%`,
                      transform: `translateX(-50%) translateY(-50%)`,
                      borderColor: year === selectedYear ? '#7fc341' : undefined,
                      backgroundColor: year === selectedYear ? '#7fc341' : undefined,
                    }}
                    title={year.toString()}
                  />
                ))}
              </div>
              
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{availableYears[0]}</span>
                <span>{availableYears[Math.floor(availableYears.length / 2)]}</span>
                <span>{availableYears[availableYears.length - 1]}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => stepYear('prev')}
                disabled={selectedYear === availableYears[0]}
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={isPlaying ? stopPlayback : startPlayback}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  isPlaying 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                    : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => stepYear('next')}
                disabled={selectedYear === availableYears[availableYears.length - 1]}
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={resetPlayback}
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-foreground transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
                <FastForward className="w-4 h-4 text-muted-foreground" />
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-2 py-1 bg-muted/50 border border-border/50 rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#7fc341]"
                >
                  <option value={3000}>0.5x</option>
                  <option value={1500}>1x</option>
                  <option value={750}>2x</option>
                  <option value={400}>4x</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Year Stats */}
        {yearStats && viewMode !== 'cluster' && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Years Since {baseYear}</div>
              <div className="text-lg font-bold text-foreground">{selectedYear - baseYear} years</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Growth</div>
              <div className={`text-lg font-bold ${yearStats.avgGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatGrowth(yearStats.avgGrowth)}
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Max Growth</div>
              <div className="text-lg font-bold text-green-500">{formatGrowth(yearStats.maxGrowth)}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Min Growth</div>
              <div className="text-lg font-bold text-red-500">{formatGrowth(yearStats.minGrowth)}</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Countries</div>
              <div className="text-lg font-bold text-foreground">{yearStats.count}</div>
            </div>
          </div>
        )}

        {/* Cluster Stats */}
        {yearStats && viewMode === 'cluster' && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2" style={{ 
              backgroundColor: `${CLUSTER_COLORS['Stable Urbanizers']}15`,
              borderColor: CLUSTER_COLORS['Stable Urbanizers']
            }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CLUSTER_COLORS['Stable Urbanizers'] }}>
                Stable Urbanizers
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{yearStats.stableCount}</div>
              <div className="text-xs text-muted-foreground">
                {((yearStats.stableCount / yearStats.count) * 100).toFixed(1)}% of countries
              </div>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ 
              backgroundColor: `${CLUSTER_COLORS['Volatile Urbanizers']}15`,
              borderColor: CLUSTER_COLORS['Volatile Urbanizers']
            }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CLUSTER_COLORS['Volatile Urbanizers'] }}>
                Volatile Urbanizers
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{yearStats.volatileCount}</div>
              <div className="text-xs text-muted-foreground">
                {((yearStats.volatileCount / yearStats.count) * 100).toFixed(1)}% of countries
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Countries</div>
              <div className="text-3xl font-bold text-foreground mb-1">{yearStats.count}</div>
              <div className="text-xs text-muted-foreground">
                Data for {selectedYear}
              </div>
            </div>
          </div>
        )}

        {/* Top Growers */}
        {yearStats?.topGrowers && yearStats.topGrowers.length > 0 && selectedYear > baseYear && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-yellow-500/10 rounded-lg border border-green-500/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Top Growing Economies (since {baseYear})</div>
            <div className="flex flex-wrap gap-3">
              {yearStats.topGrowers.map((country: any, idx: number) => (
                <div key={country.country} className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg">
                  <span className="text-lg font-bold text-[#7fc341]">#{idx + 1}</span>
                  <span className="font-medium text-foreground">{country.country}</span>
                  <span className="text-green-500 font-bold">{formatGrowth(country.growthPercent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Globe Container */}
        <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden rounded-xl border-2 border-border/30 bg-black">
          <div ref={containerRef} className="w-full h-full" />
          
          {!isGlobeReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-white text-lg animate-pulse">Loading Globe...</div>
            </div>
          )}
          
          {/* Year Overlay */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
            <div className="text-4xl font-black text-white tracking-tight">{selectedYear}</div>
            <div className="text-sm text-white/70">{selectedYear - baseYear} years since {baseYear}</div>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-xl z-10 min-w-[260px]">
            <div className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
              {viewMode === 'growth' ? 'GDP Growth Since ' + baseYear : viewMode === 'absolute' ? 'GDP Ranking' : 'Country Clusters'}
            </div>
            
            {viewMode === 'growth' ? (
              <>
                <div className="mb-3">
                  <div className="h-8 rounded-md overflow-hidden flex shadow-inner">
                    <div className="flex-1" style={{ background: 'linear-gradient(to right, #1E3A8A, #4682B4, #FED7AA, #FDBA74, #FB923C, #F97316, #EA580C, #DC2626)' }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold mt-1">
                    <span style={{ color: '#1E3A8A' }}>-30%</span>
                    <span style={{ color: '#4682B4' }}>0%</span>
                    <span style={{ color: '#FB923C' }}>+60%</span>
                    <span style={{ color: '#F97316' }}>+90%</span>
                    <span style={{ color: '#DC2626' }}>+150%</span>
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-border/30 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#DC2626' }} />
                    <span className="text-muted-foreground">Very High (+120%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#EA580C' }} />
                    <span className="text-muted-foreground">High (+90-120%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#F97316' }} />
                    <span className="text-muted-foreground">Strong (+60-90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#FB923C' }} />
                    <span className="text-muted-foreground">Good (+30-60%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#FDBA74' }} />
                    <span className="text-muted-foreground">Moderate (+10-30%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#FED7AA' }} />
                    <span className="text-muted-foreground">Low (0-10%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: '#4682B4' }} />
                    <span className="text-muted-foreground">Decline (negative)</span>
                  </div>
                </div>
              </>
            ) : viewMode === 'absolute' ? (
              <>
                <div className="mb-3">
                  <div className="h-6 rounded-md overflow-hidden flex shadow-inner">
                    <div className="flex-1" style={{ background: 'linear-gradient(to right, #0000AA, #0066FF, #00BFFF, #00FF7F, #FFFF00, #FF8C00, #FF0000)' }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold mt-1">
                    <span className="text-blue-400">Bottom</span>
                    <span className="text-green-400">Middle</span>
                    <span className="text-red-400">Top</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Colors show GDP ranking within the current year (percentile-based)
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg border-2" style={{ 
                    backgroundColor: `${CLUSTER_COLORS['Stable Urbanizers']}20`,
                    borderColor: CLUSTER_COLORS['Stable Urbanizers']
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: CLUSTER_COLORS['Stable Urbanizers'] }} />
                      <span className="font-bold text-foreground">Stable Urbanizers</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Countries with higher urbanization, lower inequality (Gini), and better peace scores. Typically developed nations with stable institutions.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border-2" style={{ 
                    backgroundColor: `${CLUSTER_COLORS['Volatile Urbanizers']}20`,
                    borderColor: CLUSTER_COLORS['Volatile Urbanizers']
                  }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded shadow-sm" style={{ backgroundColor: CLUSTER_COLORS['Volatile Urbanizers'] }} />
                      <span className="font-bold text-foreground">Volatile Urbanizers</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Countries with ongoing urbanization, higher inequality, and lower peace scores. Often developing nations with rapid change.
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  Clusters determined by K-Means analysis of 53 socioeconomic indicators
                </div>
              </>
            )}
          </div>
          
          {/* Countries Count */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50 text-sm">
            <span className="text-muted-foreground">Countries: </span>
            <span className="font-bold text-foreground">{currentYearCountryData.size}</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-4 p-5 bg-gradient-to-br from-background/50 to-background/30 rounded-xl border-2 border-border/30">
          <div className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
            {viewMode === 'cluster' ? 'Understanding Country Clusters' : 'Visualization Guide'}
          </div>
          {viewMode === 'cluster' ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Countries are automatically grouped into two clusters using K-Means machine learning algorithm 
                based on 53 socioeconomic indicators including urbanization, peace scores, inequality, 
                economic development, and environmental factors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="font-semibold text-foreground mb-1" style={{ color: CLUSTER_COLORS['Stable Urbanizers'] }}>
                    Stable Urbanizers
                  </div>
                  <p className="text-xs">
                    Characterized by: Lower Global Peace Index scores (more peaceful), 
                    lower Gini coefficients (less inequality), higher urbanization rates, 
                    and better overall stability metrics.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="font-semibold text-foreground mb-1" style={{ color: CLUSTER_COLORS['Volatile Urbanizers'] }}>
                    Volatile Urbanizers
                  </div>
                  <p className="text-xs">
                    Characterized by: Higher Global Peace Index scores (less peaceful), 
                    higher Gini coefficients (more inequality), rapid urbanization transitions, 
                    and developing economic structures.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: '#DC2626' }}></div>
                <div>
                  <div className="font-semibold text-foreground">Dark Red = Very High Growth</div>
                  <div className="text-muted-foreground">+120% or more (over doubled their GDP)</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: '#FB923C' }}></div>
                <div>
                  <div className="font-semibold text-foreground">Orange = Good to Strong Growth</div>
                  <div className="text-muted-foreground">+30% to +90% (healthy expansion)</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: '#4682B4' }}></div>
                <div>
                  <div className="font-semibold text-foreground">Blue = Low Growth or Decline</div>
                  <div className="text-muted-foreground">Below +30% or negative growth</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
