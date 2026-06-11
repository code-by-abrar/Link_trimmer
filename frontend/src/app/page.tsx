"use client"

import { useEffect, useState } from 'react'
import ShortenForm from '@/components/ShortenForm'
import UrlTable from '@/components/UrlTable'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import ThemeToggle from '@/components/ThemeToggle'
import { getUrls, URLInfo } from '@/lib/api'
import { Scissors, Globe, BarChart3, Zap, ShieldCheck } from 'lucide-react'

export default function Home() {
  const [urls, setUrls] = useState<URLInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShortKey, setSelectedShortKey] = useState<string | null>(null)

  const fetchUrls = async () => {
    try {
      const data = await getUrls()
      setUrls(data)
    } catch (error) {
      console.error('Failed to fetch URLs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const fetch = async () => {
      try {
        const data = await getUrls()
        if (active) setUrls(data)
      } catch (error) {
        console.error('Failed to fetch URLs', error)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetch()
    return () => { active = false }
  }, [])

  return (
    <main className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300 pb-16">
      {/* Dynamic Drifting Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/8 blur-[150px] pointer-events-none animate-float-slower" />

      {/* Floating Glassmorphic Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-all">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          {/* Logo */}
          <div 
            onClick={() => setSelectedShortKey(null)} 
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-105 transition-all">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-accent">
              LinkTrim
            </span>
          </div>

          {/* Theme & Mode Controllers */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="container mx-auto px-4 pt-12 space-y-12 max-w-5xl relative z-10">
        
        {/* Dynamic Hero Section */}
        {!selectedShortKey && (
          <div className="text-center space-y-5 py-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight md:leading-none">
              Shorten Links. <br className="sm:hidden" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
                Track Performance.
              </span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Create short, powerful links that monitor your audience in real-time. 
              Configure geolocation, expiration limits, and scale your brand.
            </p>
          </div>
        )}

        {selectedShortKey ? (
          <AnalyticsDashboard 
            shortKey={selectedShortKey} 
            onBack={() => setSelectedShortKey(null)} 
          />
        ) : (
          <>
            {/* Shorten Form Card */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ShortenForm onUrlAdded={fetchUrls} />
            </section>

            {/* Dashboard Queue Table */}
            <section className="space-y-6 animate-in fade-in duration-700">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <h2 className="font-heading text-2xl font-bold tracking-tight">Active Queue</h2>
                  <p className="text-xs text-muted-foreground">Manage and analyze your shortened redirection assets.</p>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-secondary/80 border text-xs font-semibold">
                  Total Assets: {urls.length}
                </div>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center h-52 border rounded-2xl bg-card/45 backdrop-blur-md space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-xs text-muted-foreground animate-pulse">Loading links queue...</p>
                </div>
              ) : (
                <UrlTable 
                  urls={urls} 
                  onShowAnalytics={(key) => setSelectedShortKey(key)} 
                />
              )}
            </section>

            {/* Premium Features Information Section */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-border/40 animate-in fade-in duration-1000">
              <div className="p-5 rounded-2xl border bg-card/40 backdrop-blur-sm space-y-2 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm">Instant Redirects</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Redirection rules process in microseconds through our heavily-cached, ultra-responsive engine.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card/40 backdrop-blur-sm space-y-2 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm">Real-time Analytics</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitor raw clicks, unique visitors, referral sources, and traffic geographical distributions.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card/40 backdrop-blur-sm space-y-2 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm">Geo-Targeting</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Route users dynamically based on their country. Direct audiences to localized landers.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card/40 backdrop-blur-sm space-y-2 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-sm">Smart Controls</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set precise expiration dates or limits on absolute click capacity to secure temporary distributions.
                </p>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="pt-8 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p>© 2026 LinkTrim. Crafted for high-performance redirection tracking.</p>
        </footer>
      </div>
    </main>
  )
}
