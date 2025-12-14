export function DashboardFooter() {
  return (
    <footer className="px-4 lg:px-6 py-8 border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-6">
          {/* About Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#7fc341] to-[#9bdf57] rounded-full"></span>
              About This Dashboard
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              Comprehensive analysis of global urbanization patterns, peace indicators, 
              and socioeconomic factors using advanced data visualization techniques.
            </p>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#9bdf57] to-[#b6ed7a] rounded-full"></span>
              Data Sources
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Global Peace Index</li>
              <li>• World Bank Indicators</li>
              <li>• UN Urbanization Data</li>
              <li>• Environmental Statistics</li>
            </ul>
          </div>

          {/* Technical Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#b6ed7a] to-[#7fc341] rounded-full"></span>
              Technologies
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Next.js 15 & React</li>
              <li>• Recharts & Globe.GL</li>
              <li>• TypeScript & Tailwind</li>
              <li>• Advanced Analytics</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Global Urbanization Analytics
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#7fc341] animate-pulse"></div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Dashboard Active</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
