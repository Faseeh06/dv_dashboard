# Clustering Indicators Documentation

## Overview
The clustering algorithm should use **all 46 indicators** to properly classify countries into two distinct groups: **Stable Urbanizers** and **Volatile Urbanizers**.

## Complete List of 46 Indicators

### 1. **Population & Demographics** (4 indicators)
1. `total_pop` - Total population
2. `pop_dens_sq_km` - Population density (per square km)
3. `urban_pop_perc` - Urban population percentage
4. `rural_pop_perc` - Rural population percentage *(calculate: 100 - urban_pop_perc)*

### 2. **Energy & Environment** (4 indicators)
5. `elect_access_pop` - Access to electricity (% of population)
6. `ren_energy_cons_perc` - Renewable energy consumption percentage
7. `clean_fuel_tech_cook_pop` - Access to clean fuels and technologies for cooking
8. `co2_emiss_excl_lulucf` - CO2 emissions (excluding LULUCF)

### 3. **Inequality & Crime** (8 indicators)
9. `gini_coefficient` - Gini coefficient (2021 prices)
10. `perceptions_of_criminality` - Perceptions of criminality
11. `homicide_rate` - Homicide rate
12. `police_rate` - Police rate
13. `incarceration_rate` - Incarceration rate
14. `access_to_small_arms` - Access to small arms
15. `violent_crime` - Violent crime
16. `violent_demonstrations` - Violent demonstrations

### 4. **Conflict & Instability** (13 indicators)
17. `intensity_of_internal_conflict` - Intensity of internal conflict
18. `political_instability` - Political instability
19. `political_terror_scale` - Political Terror Scale
20. `weapons_imports` - Weapons imports
21. `terrorism_impact` - Terrorism impact
22. `deaths_from_internal_conflict` - Deaths from internal conflict
23. `internal_conflicts_fought` - Internal conflicts fought
24. `weapons_exports` - Weapons exports
25. `refugees_and_idps` - Refugees and IDPs
26. `neighbouring_countries_relations` - Neighbouring countries relations
27. `external_conflicts_fought` - External conflicts fought
28. `deaths_from_external_conflict` - Deaths from external conflict
29. `ongoing_conflict` - Ongoing conflict

### 5. **Military & Security** (7 indicators)
30. `military_expenditure_gdp` - Military expenditure (% GDP)
31. `armed_services_personnel_rate` - Armed services personnel rate
32. `un_peacekeeping_funding` - UN peacekeeping funding
33. `nuclear_and_heavy_weapons` - Nuclear and heavy weapons
34. `safety_and_security` - Safety and security
35. `militarisation` - Militarisation index
36. `external_peace` - External peace score

### 6. **Peace Indices** (3 indicators)
37. `overall_score` - Overall Global Peace Index score
38. `internal_peace` - Internal peace score
39. `external_peace` - External peace score *(if not duplicate)*

### 7. **Economic & Agriculture** (7 indicators)
40. `ag_value_added_gdp` - Agriculture, forestry, and fishing, value added (% of GDP)
41. `ag_value_added_growth` - Agriculture, forestry, and fishing, value added (annual % growth)
42. `natural_resources_depletion` - Adjusted savings: natural resources depletion (% of GNI)
43. `net_forest_depletion` - Adjusted savings: net forest depletion (% of GNI)
44. `energy_depletion` - Adjusted savings: energy depletion (% of GNI)
45. `carbon_damage` - Adjusted savings: carbon dioxide damage (% of GNI)
46. `gdp` - GDP (optional, for context)

## Current Implementation Status

### ✅ Already Included (25 indicators)
The clustering currently uses these indicators:
- urbanPopPerc
- giniCoefficient
- overallScore
- homicideRate
- militarisation
- politicalInstability
- internalPeace
- weaponsExports
- weaponsImports
- nuclearHeavyWeapons
- ongoingConflict
- neighbouringCountriesRelations
- intensityOfInternalConflict
- agValueAdded
- renEnergyConsPerc
- cleanCookingAccess
- perceptionsOfCriminality
- violentCrime
- violentDemonstrations
- accessToSmallArms
- safetyAndSecurity
- totalPop
- carbonDamage
- gdp
- popDensSqKm

### ⚠️ Missing Indicators (21 indicators)
These should be added to the DataRecord type and clustering:
1. rural_pop_perc *(calculate from urban_pop_perc)*
2. elect_access_pop
3. co2_emiss_excl_lulucf
4. police_rate
5. incarceration_rate
6. political_terror_scale
7. terrorism_impact
8. deaths_from_internal_conflict
9. internal_conflicts_fought
10. military_expenditure_gdp
11. armed_services_personnel_rate
12. un_peacekeeping_funding
13. external_peace
14. refugees_and_idps
15. external_conflicts_fought
16. deaths_from_external_conflict
17. ag_value_added_growth
18. natural_resources_depletion
19. net_forest_depletion
20. energy_depletion
21. Access to electricity (if different from elect_access_pop)

## Implementation Steps

### 1. Update DataRecord Type
Add missing fields to `lib/loadData.ts`:

```typescript
export type DataRecord = {
  // ... existing fields ...
  
  // Add these:
  ruralPopPerc: number | null
  electAccessPop: number | null
  co2Emissions: number | null
  policeRate: number | null
  incarcerationRate: number | null
  politicalTerrorScale: number | null
  terrorismImpact: number | null
  deathsInternalConflict: number | null
  internalConflictsFought: number | null
  militaryExpGdp: number | null
  armedServicesRate: number | null
  unPeacekeepingFunding: number | null
  externalPeace: number | null
  refugeesIdps: number | null
  externalConflictsFought: number | null
  deathsExternalConflict: number | null
  agValueAddedGrowth: number | null
  naturalResourcesDepletion: number | null
  netForestDepletion: number | null
  energyDepletion: number | null
  electAccessPopulation: number | null
}
```

### 2. Update CSV Parsing
In `loadData.ts`, map CSV columns to these new fields in the `normalizeRecord` function.

### 3. Update Clustering Logic
In `lib/clustering.ts`:

1. Add all new fields to the `CountryProfile` interface
2. Add them to the `countryMap` accumulation logic
3. Add them to the `features` array for clustering
4. The algorithm will automatically use all features for classification

### 4. Feature Normalization
The clustering already uses StandardScaler normalization, so all features (regardless of scale) will be properly normalized before clustering.

## Benefits of Using All 46 Indicators

### More Accurate Clustering
- **Comprehensive**: Captures all aspects of country profiles
- **Robust**: Less sensitive to individual indicator fluctuations
- **Meaningful**: Separates countries based on holistic patterns

### Better Separation
- **Stable Urbanizers**: Strong institutions, low conflict, good governance
- **Volatile Urbanizers**: Weak institutions, high conflict, governance challenges

### Enhanced Insights
- Correlations become more meaningful
- Patterns are backed by comprehensive data
- Policy implications are more actionable

## Notes

1. **Data Availability**: Not all indicators may be available in your CSV
2. **Missing Values**: The code already handles missing data by excluding incomplete profiles
3. **Normalization**: Critical for indicators with different scales (e.g., population vs percentages)
4. **Cluster Validation**: The algorithm determines which cluster is "Stable" vs "Volatile" based on overall peace scores

## Next Steps

1. ✅ Check your CSV for all 46 indicator columns
2. ⚠️ Add missing fields to DataRecord type
3. ⚠️ Update CSV parsing logic
4. ⚠️ Update clustering to include all fields
5. ✅ Test clustering results
6. ✅ Validate cluster separation makes sense

---

**Current Status**: The clustering uses 25 indicators. To achieve optimal results, add the remaining 21 indicators from your dataset.
