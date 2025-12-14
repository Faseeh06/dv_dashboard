import { CrimeHeatmap } from '@/components/charts/CrimeHeatmap'
import { FlipChartContainer } from '@/components/charts/FlipChartContainer'
import { UrbanizationBarChart } from '@/components/charts/UrbanizationBarChart'
import { PeaceParadoxScatter } from '@/components/charts/PeaceParadoxScatter'
import { loadData } from '@/lib/loadData'
import { GlobeGLViewer } from '@/components/globe-gl-viewer'
import { ParticlesBackground } from '@/components/particles-background'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardHeader, SectionHeader } from '@/components/dashboard-header'

export default async function Page() {
  const records = await loadData()

  const crimeData = records.map((d) => ({
    giniCoefficient: d.giniCoefficient,
    urbanPopPerc: d.urbanPopPerc,
    perceptionsOfCriminality: d.perceptionsOfCriminality,
    homicideRate: d.homicideRate,
    violentCrime: d.violentCrime,
    violentDemonstrations: d.violentDemonstrations,
    accessToSmallArms: d.accessToSmallArms,
    safetyAndSecurity: d.safetyAndSecurity,
  }))

  // Calculate key metrics
  const totalCountries = new Set(records.map(d => d.country)).size
  const latestYear = Math.max(...records.map(d => d.year || 0))
  const avgUrbanization = records
    .filter(d => d.urbanPopPerc != null)
    .reduce((sum, d) => sum + (d.urbanPopPerc || 0), 0) / records.filter(d => d.urbanPopPerc != null).length
  
  const stableCount = records.filter(d => d.clusterLabel?.includes('Stable')).length
  const volatileCount = records.filter(d => d.clusterLabel?.includes('Volatile')).length

  return (
    <div className="min-h-screen bg-background relative">
      <ParticlesBackground />
      <div className="flex flex-1 flex-col relative z-10">
        <div className="@container/main flex flex-1 flex-col">
          <div className="flex flex-col gap-8 py-6 md:py-8">
            
            {/* Dashboard Header */}
            <div className="px-4 lg:px-6">
              <DashboardHeader 
                title="Global Urbanization & Peace Analytics"
                description={`Comprehensive analysis of urbanization patterns, peace indicators, and socioeconomic factors across ${totalCountries} countries`}
              />

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-card to-card/50 border-[#7fc341]/30 hover:border-[#7fc341]/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{totalCountries}</div>
                    <p className="text-xs text-muted-foreground mt-1">Data coverage</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/50 border-[#9bdf57]/30 hover:border-[#9bdf57]/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Latest Year</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{latestYear}</div>
                    <p className="text-xs text-muted-foreground mt-1">Most recent data</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/50 border-[#b6ed7a]/30 hover:border-[#b6ed7a]/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg Urbanization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{avgUrbanization.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">Global average</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-card to-card/50 border-[#7fc341]/30 hover:border-[#7fc341]/50 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Country Clusters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">2</div>
                    <p className="text-xs text-muted-foreground mt-1">Stable & Volatile</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Section 1: Global Overview */}
            <div id="overview" className="px-4 lg:px-6 scroll-mt-8">
              <SectionHeader 
                title="Global Overview"
                description="Interactive 3D visualization of global economic and demographic data"
              />
              <GlobeGLViewer data={records} />
            </div>
            
            {/* Section 2: Security Indicators - Group Bar Chart */}
            <div id="security" className="px-4 lg:px-6 scroll-mt-8">
              <SectionHeader 
                title="Security Indicators"
                description="Comparative analysis of peace and security metrics by urbanization level"
              />
              <UrbanizationBarChart data={records} />
            </div>

            {/* Section 3: Correlation Deep Dive */}
            <div id="analysis" className="px-4 lg:px-6 scroll-mt-8">
              <SectionHeader 
                title="Correlation Deep Dive"
                description="Detailed correlation analysis between urbanization and peace indicators"
              />
              <PeaceParadoxScatter data={records} />
            </div>

            {/* Section 4: Crime & Safety Analysis */}
            <div id="crime" className="px-4 lg:px-6 scroll-mt-8">
              <SectionHeader 
                title="Crime & Safety Analysis"
                description="Heatmap analysis of crime indicators by urbanization and inequality levels"
              />
              <CrimeHeatmap data={crimeData} />
            </div>

            {/* Section 5: Environmental Impact */}
            <div id="environment" className="px-4 lg:px-6 scroll-mt-8">
              <SectionHeader 
                title="Environmental Impact"
                description="Carbon emissions and renewable energy consumption patterns"
              />
              <FlipChartContainer data={records} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
