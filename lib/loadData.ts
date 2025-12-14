import { promises as fs } from 'fs'
import path from 'path'

export type DataRecord = {
  country: string
  year: number | null
  urbanPopPerc: number | null
  agValueAdded: number | null
  renEnergyConsPerc: number | null
  cleanCookingAccess: number | null
  clusterLabel: string
  giniCoefficient: number | null
  perceptionsOfCriminality: number | null
  homicideRate: number | null
  violentCrime: number | null
  violentDemonstrations: number | null
  accessToSmallArms: number | null
  safetyAndSecurity: number | null
  totalPop: number | null
  carbonDamage: number | null
  gdp: number | null
  popDensSqKm: number | null
  overallScore: number | null
  militarisation: number | null
  politicalInstability: number | null
  internalPeace: number | null
  weaponsExports: number | null
  weaponsImports: number | null
  nuclearHeavyWeapons: number | null
  ongoingConflict: number | null
  neighbouringCountriesRelations: number | null
  intensityOfInternalConflict: number | null
}

const CANDIDATE_PATHS = [
  path.join(process.cwd(), 'public', 'data', 'data.csv'),
  path.join(
    process.cwd(),
    'public',
    'Data',
    'combined_urbanization_life_quality_2008_2020.csv'
  ),
  path.join(
    process.cwd(),
    'public',
    'combined_urbanization_life_quality_2008_2020.csv'
  ),
]

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value === 'null' || value === 'NULL' || value === 'NaN') {
    return null
  }
  const num = Number(value.trim())
  return Number.isFinite(num) && !isNaN(num) ? num : null
}

function getValue(row: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') {
      return row[key]
    }
  }
  return undefined
}

function normalizeRecord(row: Record<string, string>): DataRecord {
  const clusterRaw =
    row['Cluster_Label'] ||
    row['cluster_label'] ||
    row['Cluster'] ||
    row['cluster'] ||
    ''

  let clusterLabel = clusterRaw
  if (!clusterLabel) {
    clusterLabel = 'Unlabeled'
  } else if (!Number.isNaN(Number(clusterLabel))) {
    clusterLabel = `Cluster ${clusterLabel}`
  }

  return {
    country: getValue(row, 'Country', 'country') || '',
    year: toNumber(getValue(row, 'Year', 'year')),
    urbanPopPerc: toNumber(getValue(row, 'urban_pop_perc', 'urban_pop_percentage', 'urban_pop_%')),
    agValueAdded: toNumber(
      getValue(
        row,
        'Agriculture, forestry, and fishing, value added (% of GDP)',
        'ag_value_added',
        'Agriculture forestry and fishing value added (% of GDP)'
      )
    ),
    renEnergyConsPerc: toNumber(
      getValue(row, 'ren_energy_cons_perc', 'ren_energy_percentage', 'ren_energy_cons_%')
    ),
    cleanCookingAccess: toNumber(
      getValue(
        row,
        'clean_fuel_tech_cook_pop',
        'clean_cooking_access',
        'Access to clean fuels and technologies for cooking (% of population)'
      )
    ),
    giniCoefficient: toNumber(
      getValue(
        row,
        'Gini coefficient (2021 prices)',
        'gini_coef',
        'gini_coefficient',
        'Gini coefficient'
      )
    ),
    perceptionsOfCriminality: toNumber(
      getValue(row, 'perceptions of criminality', 'perceptions_of_criminality', 'perceptions_crime')
    ),
    homicideRate: toNumber(getValue(row, 'homicide rate', 'homicide_rate')),
    violentCrime: toNumber(getValue(row, 'Violent crime', 'violent_crime')),
    violentDemonstrations: toNumber(
      getValue(row, 'violent demonstrations', 'violent_demonstrations')
    ),
    accessToSmallArms: toNumber(
      getValue(row, 'Access to small arms', 'access_to_small_arms', 'Access to small arms')
    ),
    safetyAndSecurity: toNumber(
      getValue(row, 'safety and security', 'safety_and_security', 'safety & security')
    ),
    totalPop: toNumber(
      getValue(row, 'total_pop', 'total_population', 'total population')
    ),
    carbonDamage: toNumber(
      getValue(
        row,
        'Adjusted savings: carbon dioxide damage (% of GNI)',
        'carbon_damage',
        'carbon_dioxide_damage'
      )
    ),
    gdp: toNumber(
      getValue(row, 'gdp', 'GDP', 'gdp_usd')
    ),
    popDensSqKm: toNumber(
      getValue(row, 'pop_dens_sq_km', 'pop_dens_sq_km', 'population_density')
    ),
    overallScore: toNumber(
      getValue(row, 'overall score', 'overall_score', 'Overall Score')
    ),
    militarisation: toNumber(
      getValue(row, 'militarisation', 'militarization', 'militarisation')
    ),
    politicalInstability: toNumber(
      getValue(row, 'Political instability', 'political_instability', 'Political Instability')
    ),
    internalPeace: toNumber(
      getValue(row, 'internal peace', 'internal_peace', 'Internal Peace')
    ),
    weaponsExports: toNumber(
      getValue(row, 'weapons exports', 'weapons_exports', 'weapons exports')
    ),
    weaponsImports: toNumber(
      getValue(row, 'weapons imports', 'weapons_imports', 'weapons imports')
    ),
    nuclearHeavyWeapons: toNumber(
      getValue(row, 'nuclear and heavy weapons', 'nuclear_heavy_weapons', 'nuclear and heavy weapons')
    ),
    ongoingConflict: toNumber(
      getValue(row, 'ongoing conflict', 'ongoing_conflict', 'ongoing conflict')
    ),
    neighbouringCountriesRelations: toNumber(
      getValue(row, 'Neighbouring countries relations', 'neighbouring_countries_relations', 'Neighbouring countries relations')
    ),
    intensityOfInternalConflict: toNumber(
      getValue(row, 'intensity of internal conflict', 'intensity_of_internal_conflict', 'intensity of internal conflict')
    ),
    clusterLabel,
  }
}

export async function loadData(csvPath?: string): Promise<DataRecord[]> {
  const finalPath = csvPath || (await resolveCsvPath())
  let raw = await fs.readFile(finalPath, 'utf-8')
  
  // Remove BOM if present
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1)
  }
  
  const lines = raw.trim().split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }
  
  const headerLine = lines[0]
  const headers = splitCsvLine(headerLine)
  
  // Log headers for debugging
  console.log('CSV Headers:', headers.slice(0, 10), '...')

  const records: DataRecord[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    if (!row.trim()) continue
    
    const values = splitCsvLine(row)
    // Pad values array if needed
    while (values.length < headers.length) {
      values.push('')
    }
    
    const record = headers.reduce<Record<string, string>>((acc, key, idx) => {
      acc[key] = values[idx] ?? ''
      return acc
    }, {})
    
    const normalized = normalizeRecord(record)
    
    // Filter out invalid records (summary rows, empty countries, etc.)
    if (normalized.country && 
        normalized.country.trim() !== '' && 
        normalized.year != null &&
        !normalized.country.toLowerCase().includes('ultra-urban') &&
        !normalized.country.toLowerCase().includes('average') &&
        !normalized.country.toLowerCase().includes('summary') &&
        !normalized.country.toLowerCase().includes('total') &&
        !normalized.country.toLowerCase().includes('analysis') &&
        normalized.country.length < 50) {
      records.push(normalized)
    }
  }

  console.log(`Loaded ${records.length} valid records`)
  console.log('Sample record:', {
    country: records[0]?.country,
    gini: records[0]?.giniCoefficient,
    urban: records[0]?.urbanPopPerc,
    perceptions: records[0]?.perceptionsOfCriminality,
  })

  return records
}

async function resolveCsvPath() {
  for (const candidate of CANDIDATE_PATHS) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) {
        return candidate
      }
    } catch (error) {
      continue
    }
  }

  throw new Error(
    'CSV file not found. Place it at /public/data/data.csv or /public/Data/combined_urbanization_life_quality_2008_2020.csv'
  )
}

