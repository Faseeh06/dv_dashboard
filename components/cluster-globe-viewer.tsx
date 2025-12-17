"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { countryCoordinates } from '@/lib/countryCoordinates'
import type { DataRecord } from '@/lib/loadData'
import { clusterCountries } from '@/lib/clustering'

interface ClusterGlobeViewerProps {
  data: DataRecord[]
}

// Cluster colors - Red for Volatile, Green for Stable
const CLUSTER_COLORS = {
  'Stable Urbanizers': '#22c55e',     // Green
  'Volatile Urbanizers': '#ef4444',   // Red
  'Unknown': 'rgba(80, 80, 80, 0.6)',
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

export function ClusterGlobeViewer({ data }: ClusterGlobeViewerProps) {
  const globeInstanceRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const countriesGeoJsonRef = useRef<any>(null)
  const isGlobeInitializedRef = useRef(false)
  const [isGlobeReady, setIsGlobeReady] = useState(false)

  // Perform clustering (same as PeaceParadoxScatter)
  const countryProfiles = useMemo(() => clusterCountries(data), [data])

  // Convert country profiles to map with display data
  const countryClusterData = useMemo(() => {
    const countryMap = new Map<string, any>()
    
    countryProfiles.forEach((profile, country) => {
      const coords = countryCoordinates[country]
      if (!coords) return
      
      const clusterLabel = profile.clusterLabel
      const clusterColor = CLUSTER_COLORS[clusterLabel as keyof typeof CLUSTER_COLORS] || CLUSTER_COLORS['Unknown']
      
      countryMap.set(country, {
        country: profile.country,
        clusterLabel,
        clusterColor,
        urbanPopPerc: profile.urbanPopPerc,
        totalPop: profile.totalPop,
        giniCoefficient: profile.giniCoefficient,
        overallScore: profile.overallScore,
      })
    })
    
    return countryMap
  }, [countryProfiles])

  // Cluster statistics
  const clusterStats = useMemo(() => {
    const countryData = Array.from(countryClusterData.values())
    if (countryData.length === 0) return null
    
    const stableCount = countryData.filter(d => d.clusterLabel === 'Stable Urbanizers').length
    const volatileCount = countryData.filter(d => d.clusterLabel === 'Volatile Urbanizers').length
    
    return { 
      stableCount,
      volatileCount,
      totalCount: countryData.length
    }
  }, [countryClusterData])

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

  // UPDATE polygon colors when data changes
  useEffect(() => {
    if (!globeInstanceRef.current || !countriesGeoJsonRef.current || !isGlobeReady) return

    const globe = globeInstanceRef.current
    const countries = countriesGeoJsonRef.current

    // Update country data with cluster information
    countries.features.forEach((feat: any) => {
      const geoCountryName = feat.properties.NAME || feat.properties.name || feat.properties.ADMIN
      const normalizedGeoName = normalizeCountryName(geoCountryName)
      
      let countryData = countryClusterData.get(geoCountryName)
      if (!countryData) countryData = countryClusterData.get(normalizedGeoName)
      
      if (!countryData) {
        for (const [dataCountry, data] of countryClusterData.entries()) {
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
        feat.properties.country = countryData.country
        feat.properties.clusterLabel = countryData.clusterLabel
        feat.properties.color = countryData.clusterColor
        feat.properties.urbanPopPerc = countryData.urbanPopPerc
        feat.properties.totalPop = countryData.totalPop
        feat.properties.giniCoefficient = countryData.giniCoefficient
        feat.properties.overallScore = countryData.overallScore
      } else {
        feat.properties.color = null
        feat.properties.country = null
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
        if (!props.country || !props.clusterLabel) return ''
        
        const popFormatted = props.totalPop ? `${(props.totalPop / 1e6).toFixed(2)}M` : 'N/A'
        const urbanFormatted = props.urbanPopPerc ? `${props.urbanPopPerc.toFixed(1)}%` : 'N/A'
        const giniFormatted = props.giniCoefficient ? `${props.giniCoefficient.toFixed(2)}` : 'N/A'
        const gpiFormatted = props.overallScore ? `${props.overallScore.toFixed(2)}` : 'N/A'
        
        const clusterBadge = props.clusterLabel ? `
          <div style="
            display: inline-block;
            padding: 6px 16px;
            background: ${props.color};
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 12px;
            color: #000;
          ">
            ${props.clusterLabel}
          </div>
        ` : ''
        
        return `
          <div style="
            background: rgba(0, 0, 0, 0.92);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            min-width: 260px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
            border-left: 5px solid ${props.color};
          ">
            <div style="font-weight: 700; font-size: 17px; margin-bottom: 12px; color: ${props.color};">
              ${props.country}
            </div>
            ${clusterBadge}
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Population:</span> 
              <span style="font-weight: 600;">${popFormatted}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Urbanization:</span> 
              <span style="font-weight: 600;">${urbanFormatted}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Gini Coefficient:</span> 
              <span style="font-weight: 600;">${giniFormatted}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="opacity: 0.7;">Peace Index:</span> 
              <span style="font-weight: 600;">${gpiFormatted}</span>
            </div>
          </div>
        `
      })

  }, [countryClusterData, isGlobeReady])

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg">
      <CardContent className="pt-6">
        {/* Cluster Stats */}
        {clusterStats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border-2" style={{ 
              backgroundColor: `${CLUSTER_COLORS['Stable Urbanizers']}15`,
              borderColor: CLUSTER_COLORS['Stable Urbanizers']
            }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CLUSTER_COLORS['Stable Urbanizers'] }}>
                Stable Urbanizers
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{clusterStats.stableCount}</div>
              <div className="text-xs text-muted-foreground">
                {((clusterStats.stableCount / clusterStats.totalCount) * 100).toFixed(1)}% of countries
              </div>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ 
              backgroundColor: `${CLUSTER_COLORS['Volatile Urbanizers']}15`,
              borderColor: CLUSTER_COLORS['Volatile Urbanizers']
            }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: CLUSTER_COLORS['Volatile Urbanizers'] }}>
                Volatile Urbanizers
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{clusterStats.volatileCount}</div>
              <div className="text-xs text-muted-foreground">
                {((clusterStats.volatileCount / clusterStats.totalCount) * 100).toFixed(1)}% of countries
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Countries</div>
              <div className="text-3xl font-bold text-foreground mb-1">{clusterStats.totalCount}</div>
              <div className="text-xs text-muted-foreground">
                K-Means Clustered
              </div>
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
          
          {/* Title Overlay */}
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/20">
            <div className="text-2xl font-black text-white tracking-tight">Country Clusters</div>
            <div className="text-sm text-white/70">K-Means Classification</div>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-xl z-10 max-w-[240px]">
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Country Clusters
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded border" style={{ 
                backgroundColor: `${CLUSTER_COLORS['Stable Urbanizers']}15`,
                borderColor: CLUSTER_COLORS['Stable Urbanizers']
              }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded shadow-sm flex-shrink-0" style={{ backgroundColor: CLUSTER_COLORS['Stable Urbanizers'] }} />
                  <span className="font-bold text-foreground text-xs">Stable Urbanizers</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                  Countries with higher urbanization, lower inequality (Gini), and better peace scores. Typically developed nations with stable institutions.
                </p>
              </div>
              <div className="p-2 rounded border" style={{ 
                backgroundColor: `${CLUSTER_COLORS['Volatile Urbanizers']}15`,
                borderColor: CLUSTER_COLORS['Volatile Urbanizers']
              }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded shadow-sm flex-shrink-0" style={{ backgroundColor: CLUSTER_COLORS['Volatile Urbanizers'] }} />
                  <span className="font-bold text-foreground text-xs">Volatile Urbanizers</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                  Countries with ongoing urbanization, higher inequality, and lower peace scores. Often developing nations with rapid change.
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
              Clusters determined by K-Means analysis of 53 socioeconomic indicators
            </div>
          </div>
          
          {/* Countries Count */}
          <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50 text-sm">
            <span className="text-muted-foreground">Countries: </span>
            <span className="font-bold text-foreground">{countryClusterData.size}</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-4 p-5 bg-gradient-to-br from-background/50 to-background/30 rounded-xl border-2 border-border/30">
          <div className="text-base font-bold text-foreground mb-3 uppercase tracking-wide">
            Understanding Country Clusters
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Countries are automatically grouped into two clusters using K-Means machine learning algorithm 
              based on 53 socioeconomic indicators including urbanization, peace scores, inequality, 
              economic development, and environmental factors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="font-semibold text-foreground mb-1" style={{ color: CLUSTER_COLORS['Stable Urbanizers'] }}>
                  Stable Urbanizers ({clusterStats?.stableCount} countries)
                </div>
                <p className="text-xs">
                  Characterized by: Lower Global Peace Index scores (more peaceful), 
                  lower Gini coefficients (less inequality), higher urbanization rates, 
                  and better overall stability metrics.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="font-semibold text-foreground mb-1" style={{ color: CLUSTER_COLORS['Volatile Urbanizers'] }}>
                  Volatile Urbanizers ({clusterStats?.volatileCount} countries)
                </div>
                <p className="text-xs">
                  Characterized by: Higher Global Peace Index scores (less peaceful), 
                  higher Gini coefficients (more inequality), rapid urbanization transitions, 
                  and developing economic structures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


