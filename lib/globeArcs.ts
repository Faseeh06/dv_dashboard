// Arc connections between countries for the 3D globe
import { countryCoordinates } from './countryCoordinates'

export type ArcData = {
  order: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  arcAlt: number
  color: string
}

export type CountryPoint = {
  lat: number
  lng: number
  size: number
  color: string
  name: string
}

const colors = ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"]

// Create connections between major countries in our dataset
export function generateCountryArcs(): ArcData[] {
  const majorCountries = [
    'United States',
    'China',
    'Japan',
    'Germany',
    'United Kingdom',
    'France',
    'Brazil',
    'Canada',
    'Russian Federation',
    'India',
    'Spain',
    'Italy',
    'Netherlands',
    'Switzerland',
    'Sweden',
  ]

  const arcs: ArcData[] = []
  let order = 1

  // Create connections between countries
  for (let i = 0; i < majorCountries.length; i++) {
    const country1 = majorCountries[i]
    const coords1 = countryCoordinates[country1]
    
    if (!coords1) continue

    // Connect to 2-3 other countries
    const numConnections = Math.min(3, majorCountries.length - i - 1)
    for (let j = 1; j <= numConnections; j++) {
      const country2Index = (i + j) % majorCountries.length
      const country2 = majorCountries[country2Index]
      const coords2 = countryCoordinates[country2]
      
      if (!coords2 || country1 === country2) continue

      arcs.push({
        order: order,
        startLat: coords1[0],
        startLng: coords1[1],
        endLat: coords2[0],
        endLng: coords2[1],
        arcAlt: 0.1 + Math.random() * 0.4, // Random arc height between 0.1 and 0.5
        color: colors[Math.floor(Math.random() * colors.length)],
      })

      order++
    }
  }

  // Add some connections from other countries
  const otherCountries = ['Austria', 'Poland', 'Thailand', 'Colombia', 'Peru']
  otherCountries.forEach(country => {
    const coords = countryCoordinates[country]
    if (!coords) return

    // Connect to US or China
    const targetCountry = Math.random() > 0.5 ? 'United States' : 'China'
    const targetCoords = countryCoordinates[targetCountry]
    if (!targetCoords) return

    arcs.push({
      order: order++,
      startLat: coords[0],
      startLng: coords[1],
      endLat: targetCoords[0],
      endLng: targetCoords[1],
      arcAlt: 0.2 + Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  })

  return arcs
}

// Generate points for all 59 countries from the dataset
export function generateCountryPoints(): CountryPoint[] {
  const points: CountryPoint[] = []
  
  Object.entries(countryCoordinates).forEach(([name, coords]) => {
    points.push({
      lat: coords[0],
      lng: coords[1],
      size: 0.8,
      color: '#3b82f6', // Blue color for all country markers
      name: name,
    })
  })
  
  return points
}

