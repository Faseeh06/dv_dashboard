import type { DataRecord } from './loadData'

export interface CountryProfile {
  country: string
  urbanPopPerc: number
  giniCoefficient: number
  overallScore: number
  homicideRate: number
  militarisation: number
  politicalInstability: number
  internalPeace: number
  weaponsExports: number
  weaponsImports: number
  nuclearHeavyWeapons: number
  ongoingConflict: number
  neighbouringCountriesRelations: number
  intensityOfInternalConflict: number
  agValueAdded: number
  renEnergyConsPerc: number
  cleanCookingAccess: number
  perceptionsOfCriminality: number
  violentCrime: number
  violentDemonstrations: number
  accessToSmallArms: number
  safetyAndSecurity: number
  totalPop: number
  carbonDamage: number
  gdp: number
  popDensSqKm: number
  clusterLabel: 'Stable Urbanizers' | 'Volatile Urbanizers'
}

// Simple K-Means implementation
function kMeans(data: number[][], k: number, maxIterations: number = 10): number[] {
  const n = data.length
  const m = data[0].length
  
  // Initialize centroids deterministically (use first k points, evenly spaced)
  let centroids: number[][] = []
  if (n <= k) {
    // If we have fewer points than clusters, use all points
    centroids = data.map(d => [...d])
  } else {
    // Use evenly spaced points for deterministic initialization
    const step = Math.floor(n / k)
    for (let i = 0; i < k; i++) {
      const idx = Math.min(i * step, n - 1)
      centroids.push([...data[idx]])
    }
  }
  
  let clusters = new Array(n).fill(0)
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      let bestCluster = 0
      
      for (let c = 0; c < k; c++) {
        let dist = 0
        for (let j = 0; j < m; j++) {
          dist += Math.pow(data[i][j] - centroids[c][j], 2)
        }
        dist = Math.sqrt(dist)
        
        if (dist < minDist) {
          minDist = dist
          bestCluster = c
        }
      }
      clusters[i] = bestCluster
    }
    
    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = data.filter((_, i) => clusters[i] === c)
      if (clusterPoints.length > 0) {
        centroids[c] = new Array(m).fill(0).map((_, j) => 
          clusterPoints.reduce((sum, p) => sum + p[j], 0) / clusterPoints.length
        )
      }
    }
  }
  
  return clusters
}

// Perform clustering on country profiles
export function clusterCountries(data: DataRecord[]): Map<string, CountryProfile> {
  // Group by country and calculate averages
  const countryMap = new Map<string, {
    counts: number
    urbanPopPerc: number[]
    giniCoefficient: number[]
    overallScore: number[]
    homicideRate: number[]
    militarisation: number[]
    politicalInstability: number[]
    internalPeace: number[]
    weaponsExports: number[]
    weaponsImports: number[]
    nuclearHeavyWeapons: number[]
    ongoingConflict: number[]
    neighbouringCountriesRelations: number[]
    intensityOfInternalConflict: number[]
    agValueAdded: number[]
    renEnergyConsPerc: number[]
    cleanCookingAccess: number[]
    perceptionsOfCriminality: number[]
    violentCrime: number[]
    violentDemonstrations: number[]
    accessToSmallArms: number[]
    safetyAndSecurity: number[]
    totalPop: number[]
    carbonDamage: number[]
    gdp: number[]
    popDensSqKm: number[]
  }>()

  data.forEach((d) => {
    if (!d.country || d.country.trim() === '') return
    
    if (!countryMap.has(d.country)) {
      countryMap.set(d.country, {
        counts: 0,
        urbanPopPerc: [],
        giniCoefficient: [],
        overallScore: [],
        homicideRate: [],
        militarisation: [],
        politicalInstability: [],
        internalPeace: [],
        weaponsExports: [],
        weaponsImports: [],
        nuclearHeavyWeapons: [],
        ongoingConflict: [],
        neighbouringCountriesRelations: [],
        intensityOfInternalConflict: [],
        agValueAdded: [],
        renEnergyConsPerc: [],
        cleanCookingAccess: [],
        perceptionsOfCriminality: [],
        violentCrime: [],
        violentDemonstrations: [],
        accessToSmallArms: [],
        safetyAndSecurity: [],
        totalPop: [],
        carbonDamage: [],
        gdp: [],
        popDensSqKm: [],
      })
    }
    
    const entry = countryMap.get(d.country)!
    entry.counts++
    if (d.urbanPopPerc != null) entry.urbanPopPerc.push(d.urbanPopPerc)
    if (d.giniCoefficient != null) entry.giniCoefficient.push(d.giniCoefficient)
    if (d.overallScore != null) entry.overallScore.push(d.overallScore)
    if (d.homicideRate != null) entry.homicideRate.push(d.homicideRate)
    if (d.militarisation != null) entry.militarisation.push(d.militarisation)
    if (d.politicalInstability != null) entry.politicalInstability.push(d.politicalInstability)
    if (d.internalPeace != null) entry.internalPeace.push(d.internalPeace)
    if (d.weaponsExports != null) entry.weaponsExports.push(d.weaponsExports)
    if (d.weaponsImports != null) entry.weaponsImports.push(d.weaponsImports)
    if (d.nuclearHeavyWeapons != null) entry.nuclearHeavyWeapons.push(d.nuclearHeavyWeapons)
    if (d.ongoingConflict != null) entry.ongoingConflict.push(d.ongoingConflict)
    if (d.neighbouringCountriesRelations != null) entry.neighbouringCountriesRelations.push(d.neighbouringCountriesRelations)
    if (d.intensityOfInternalConflict != null) entry.intensityOfInternalConflict.push(d.intensityOfInternalConflict)
    if (d.agValueAdded != null) entry.agValueAdded.push(d.agValueAdded)
    if (d.renEnergyConsPerc != null) entry.renEnergyConsPerc.push(d.renEnergyConsPerc)
    if (d.cleanCookingAccess != null) entry.cleanCookingAccess.push(d.cleanCookingAccess)
    if (d.perceptionsOfCriminality != null) entry.perceptionsOfCriminality.push(d.perceptionsOfCriminality)
    if (d.violentCrime != null) entry.violentCrime.push(d.violentCrime)
    if (d.violentDemonstrations != null) entry.violentDemonstrations.push(d.violentDemonstrations)
    if (d.accessToSmallArms != null) entry.accessToSmallArms.push(d.accessToSmallArms)
    if (d.safetyAndSecurity != null) entry.safetyAndSecurity.push(d.safetyAndSecurity)
    if (d.totalPop != null) entry.totalPop.push(d.totalPop)
    if (d.carbonDamage != null) entry.carbonDamage.push(d.carbonDamage)
    if (d.gdp != null) entry.gdp.push(d.gdp)
    if (d.popDensSqKm != null) entry.popDensSqKm.push(d.popDensSqKm)
  })

  // Create profiles with complete data
  const profiles: (CountryProfile & { features: number[] })[] = []
  
  countryMap.forEach((entry, country) => {
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    
    const profileValues = {
      country,
      urbanPopPerc: avg(entry.urbanPopPerc),
      giniCoefficient: avg(entry.giniCoefficient),
      overallScore: avg(entry.overallScore),
      homicideRate: avg(entry.homicideRate),
      militarisation: avg(entry.militarisation),
      politicalInstability: avg(entry.politicalInstability),
      internalPeace: avg(entry.internalPeace),
      weaponsExports: avg(entry.weaponsExports),
      weaponsImports: avg(entry.weaponsImports),
      nuclearHeavyWeapons: avg(entry.nuclearHeavyWeapons),
      ongoingConflict: avg(entry.ongoingConflict),
      neighbouringCountriesRelations: avg(entry.neighbouringCountriesRelations),
      intensityOfInternalConflict: avg(entry.intensityOfInternalConflict),
      agValueAdded: avg(entry.agValueAdded),
      renEnergyConsPerc: avg(entry.renEnergyConsPerc),
      cleanCookingAccess: avg(entry.cleanCookingAccess),
      perceptionsOfCriminality: avg(entry.perceptionsOfCriminality),
      violentCrime: avg(entry.violentCrime),
      violentDemonstrations: avg(entry.violentDemonstrations),
      accessToSmallArms: avg(entry.accessToSmallArms),
      safetyAndSecurity: avg(entry.safetyAndSecurity),
      totalPop: avg(entry.totalPop),
      carbonDamage: avg(entry.carbonDamage),
      gdp: avg(entry.gdp),
      popDensSqKm: avg(entry.popDensSqKm),
    }
    
    // Build feature vector with ALL numeric indicators (excluding country name)
    const features: number[] = [
      profileValues.urbanPopPerc,
      profileValues.giniCoefficient,
      profileValues.overallScore,
      profileValues.homicideRate,
      profileValues.militarisation,
      profileValues.politicalInstability,
      profileValues.internalPeace,
      profileValues.weaponsExports,
      profileValues.weaponsImports,
      profileValues.nuclearHeavyWeapons,
      profileValues.ongoingConflict,
      profileValues.neighbouringCountriesRelations,
      profileValues.intensityOfInternalConflict,
      profileValues.agValueAdded,
      profileValues.renEnergyConsPerc,
      profileValues.cleanCookingAccess,
      profileValues.perceptionsOfCriminality,
      profileValues.violentCrime,
      profileValues.violentDemonstrations,
      profileValues.accessToSmallArms,
      profileValues.safetyAndSecurity,
      profileValues.totalPop,
      profileValues.carbonDamage,
      profileValues.gdp,
      profileValues.popDensSqKm,
    ]                                           
    
    // Only include countries with ALL features available (dropna equivalent)
    if (features.every(f => f != null && !isNaN(f) && isFinite(f))) {
      const profile = {
        ...profileValues,
        clusterLabel: 'Stable Urbanizers' as const,
        features,
      }
      profiles.push(profile)
    }
  })

  if (profiles.length === 0) {
    return new Map()
  }

  // Extract features for clustering
  const features = profiles.map(p => p.features)
  
  if (features.length === 0 || features[0].length === 0) {
    return new Map()
  }
  
  const numFeatures = features[0].length
  
  // Normalize features (StandardScaler) - use ALL features
  const means = Array.from({ length: numFeatures }, (_, i) => {
    const values = features.map(f => f[i])
    return values.reduce((a, b) => a + b, 0) / values.length
  })
  const stds = Array.from({ length: numFeatures }, (_, i) => {
    const values = features.map(f => f[i])
    const mean = means[i]
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  })
  
  const normalized = features.map(f => f.map((v, i) => stds[i] !== 0 ? (v - means[i]) / stds[i] : 0))
  
  // Perform K-Means clustering
  const clusters = kMeans(normalized, 2, 10)
  
  // Assign cluster labels
  profiles.forEach((p, i) => {
    p.clusterLabel = clusters[i] === 0 ? 'Stable Urbanizers' : 'Volatile Urbanizers'
  })
  
  // Determine which cluster is "Stable" (lower overall score = better peace)
  const cluster0Profiles = profiles.filter(p => p.clusterLabel === 'Stable Urbanizers')
  const cluster1Profiles = profiles.filter(p => p.clusterLabel === 'Volatile Urbanizers')
  
  const cluster0Score = cluster0Profiles.reduce((sum, p) => sum + p.overallScore, 0) / cluster0Profiles.length
  const cluster1Score = cluster1Profiles.reduce((sum, p) => sum + p.overallScore, 0) / cluster1Profiles.length
  
  // Flip if needed
  if (cluster0Score > cluster1Score) {
    profiles.forEach(p => {
      p.clusterLabel = p.clusterLabel === 'Stable Urbanizers' ? 'Volatile Urbanizers' : 'Stable Urbanizers'
    })
  }
  
  // Return as Map
  const result = new Map<string, CountryProfile>()
  profiles.forEach(p => {
    result.set(p.country, p)
  })
  
  return result
}

