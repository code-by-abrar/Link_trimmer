"use client"

import { useEffect, useState } from 'react'
import { getAnalytics, AnalyticsReport } from '@/lib/api'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Globe, MousePointer2, Share2, ArrowLeft, TrendingUp, Compass, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NoSSR from './ui/NoSSR'

interface AnalyticsDashboardProps {
  shortKey: string
  onBack: () => void
}

export default function AnalyticsDashboard({ shortKey, onBack }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchAnalytics = async () => {
      try {
        const report = await getAnalytics(shortKey)
        if (active) setData(report)
      } catch (error) {
        console.error('Failed to fetch analytics', error)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchAnalytics()
    return () => { active = false }
  }, [shortKey])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] space-y-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary shrink-0" />
          <div className="absolute w-5 h-5 rounded-full bg-accent/20 animate-ping" />
        </div>
        <p className="text-xs text-muted-foreground animate-pulse font-semibold">Compiling detailed clickstream analytics...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 bg-card/45 backdrop-blur-md rounded-2xl border border-border/50 max-w-md mx-auto shadow-xl">
        <p className="text-sm text-destructive font-bold">Could not retrieve analytics data</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">This asset key might not exist or lacks historical click data.</p>
        <Button onClick={onBack} variant="outline" size="sm" className="mt-5 rounded-xl cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dashboard
        </Button>
      </div>
    )
  }

  // Format chart data
  const timeSeriesData = data.time_series.map(p => ({
    time: new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    clicks: p.clicks
  }))

  const countryData = Object.entries(data.summary.top_countries).map(([name, value]) => ({ 
    name: name === 'Unknown' ? 'Unknown/Local' : name, 
    value 
  }))
  
  const sourceData = Object.entries(data.summary.top_sources).map(([name, value]) => ({ 
    name: name || 'Organic/Direct', 
    value 
  }))

  // Calculate Average Redirections/hour over data points
  const hourlyPoints = data.time_series.length || 24
  const avgHourlyClicks = (data.summary.total_clicks / hourlyPoints).toFixed(1)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <Button onClick={onBack} variant="outline" size="sm" className="h-8 rounded-xl border border-border/60 hover:bg-accent/20 cursor-pointer text-xs font-semibold select-none mb-2">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Dashboard
          </Button>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight">
            Analytics for <span className="text-primary font-mono">{shortKey}</span>
          </h2>
        </div>
        
        {/* Dynamic click tag indicator */}
        <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
          <TrendingUp className="w-4 h-4" />
          <span>Real-time Tracking Active</span>
        </div>
      </div>

      {/* High-Fidelity Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Clicks */}
        <Card className="shadow-md border-border/50 bg-card/45 backdrop-blur-md glass-panel glow-card hover:-translate-y-0.5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Clicks</CardTitle>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MousePointer2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold tracking-tight font-mono text-primary">
              {data.summary.total_clicks}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Absolute lifetime redirections</p>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card className="shadow-md border-border/50 bg-card/45 backdrop-blur-md glass-panel glow-card hover:-translate-y-0.5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unique Visitors</CardTitle>
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Globe className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold tracking-tight font-mono text-foreground">
              {data.summary.unique_clicks}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">IP-deduplicated traffic reach</p>
          </CardContent>
        </Card>

        {/* Clicks/Hour Ratio */}
        <Card className="shadow-md border-border/50 bg-card/45 backdrop-blur-md glass-panel glow-card hover:-translate-y-0.5 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clicks per Hour</CardTitle>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Share2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-extrabold tracking-tight font-mono text-primary">
              {avgHourlyClicks}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">Velocity of click streams</p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Line Chart (Adapts to Active Theme Color via CSS Variable) */}
      <Card className="shadow-lg border-border/50 bg-card/45 backdrop-blur-md glass-panel">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground/90 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary" />
            <span>Click distribution over time (Hours)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 h-[300px] w-full min-h-[300px]">
          <NoSSR>
            <ResponsiveContainer width="100%" height="100%" minHeight={260}>
              <LineChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)', 
                    color: 'var(--foreground)',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: '600', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--primary)' }} 
                  dot={{ r: 2, strokeWidth: 0, fill: 'var(--accent)' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </NoSSR>
        </CardContent>
      </Card>

      {/* Bar Graphs Grid Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Countries Geographical Bar Chart */}
        <Card className="shadow-lg border-border/50 bg-card/45 backdrop-blur-md glass-panel">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground/90 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-accent" />
              <span>Demographic Origins (Top Countries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[250px] w-full min-h-[250px]">
            {countryData.length > 0 ? (
              <NoSSR>
                <ResponsiveContainer width="100%" height="100%" minHeight={210}>
                  <BarChart data={countryData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="600" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="600" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        color: 'var(--foreground)',
                        fontSize: '11px'
                      }}
                      itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </NoSSR>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic select-none">
                Waiting for country distribution telemetry...
              </div>
            )}
          </CardContent>
        </Card>

        {/* UTM Referrals Bar Chart */}
        <Card className="shadow-lg border-border/50 bg-card/45 backdrop-blur-md glass-panel">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground/90 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span>Referrals Analytics (Campaign UTMs)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[250px] w-full min-h-[250px]">
            {sourceData.length > 0 ? (
              <NoSSR>
                <ResponsiveContainer width="100%" height="100%" minHeight={210}>
                  <BarChart data={sourceData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="600" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} fontWeight="600" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        color: 'var(--foreground)',
                        fontSize: '11px'
                      }}
                      itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </NoSSR>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic select-none">
                Organic traffic - no campaign parameters recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
