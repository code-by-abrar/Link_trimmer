"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { shortenUrl, URLInfo, ShortenOptions } from '@/lib/api'
import { toast } from 'sonner'
import { Link2, Copy, Check, Settings2, Plus, Trash2, Globe, Sparkles } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function ShortenForm({ onUrlAdded }: { onUrlAdded: () => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastShortened, setLastShortened] = useState<URLInfo | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Advanced options state
  const [expiresAt, setExpiresAt] = useState('')
  const [maxClicks, setMaxClicks] = useState('')
  const [geoRules, setGeoRules] = useState<{ country: string; targetUrl: string }[]>([])

  const addGeoRule = () => {
    setGeoRules([...geoRules, { country: '', targetUrl: '' }])
  }

  const removeGeoRule = (index: number) => {
    setGeoRules(geoRules.filter((_, i) => i !== index))
  }

  const updateGeoRule = (index: number, field: 'country' | 'targetUrl', value: string) => {
    const newRules = [...geoRules]
    newRules[index][field] = value
    setGeoRules(newRules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    
    // Construct options
    const options: ShortenOptions = {}
    if (expiresAt) options.expires_at = new Date(expiresAt).toISOString()
    if (maxClicks) options.max_clicks = parseInt(maxClicks)
    
    if (geoRules.length > 0) {
      const config: Record<string, string> = {}
      geoRules.forEach(rule => {
        if (rule.country && rule.targetUrl) {
          config[rule.country.toUpperCase()] = rule.targetUrl
        }
      })
      if (Object.keys(config).length > 0) {
        options.routing_config = config
      }
    }

    try {
      const result = await shortenUrl(url, options)
      setLastShortened(result)
      setUrl('')
      // Clear advanced options
      setExpiresAt('')
      setMaxClicks('')
      setGeoRules([])
      toast.success('Link shortened successfully!')
      onUrlAdded()
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail 
        : 'Failed to shorten URL'
      toast.error(errorMessage || 'Failed to shorten URL')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!lastShortened) return
    
    // Dynamically resolve backend host or fallback to localhost
    const host = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000'
    const fullUrl = `${host}/${lastShortened.short_key}`
    
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('Short URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl glass-panel glow-card transition-all duration-300 border-border/50">
      <CardHeader className="space-y-1.5 pb-5">
        <CardTitle className="font-heading text-xl md:text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary shrink-0 animate-bounce" />
          <span>Shorten Your Link</span>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm text-muted-foreground leading-snug">
          Paste a long URL and customize temporary limits or smart geographical routing rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/very-long-and-complex-url-to-trim"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 h-11 px-4 rounded-xl border border-border/60 bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm shadow-sm transition-all outline-none"
            />
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-11 px-5 rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs md:text-sm shrink-0"
            >
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  <span>Trimming...</span>
                </div>
              ) : 'Shorten'}
            </Button>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:no-underline py-2.5 transition-all select-none">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Advanced Settings (Expiration, Geo-Targeting)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pt-3 pb-2 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expiry Date & Time</label>
                    <Input 
                      type="datetime-local" 
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background/40 focus:ring-2 focus:ring-primary/10 text-xs transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Maximum Redirections</label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 250 clicks"
                      value={maxClicks}
                      onChange={(e) => setMaxClicks(e.target.value)}
                      className="h-9 px-3 rounded-lg border border-border bg-background/40 focus:ring-2 focus:ring-primary/10 text-xs transition-all animate-in"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      Geo-Targeting Routing Rules
                    </label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addGeoRule} 
                      className="h-7 px-2.5 text-[10px] gap-1 rounded-lg border border-border hover:bg-accent/40 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-primary" /> Add Rule
                    </Button>
                  </div>
                  
                  {geoRules.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {geoRules.map((rule, index) => (
                        <div key={index} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200">
                          <Input 
                            placeholder="US, PK" 
                            maxLength={3}
                            className="w-16 h-8 text-center text-xs font-bold rounded-lg border border-border uppercase bg-background/40"
                            value={rule.country}
                            onChange={(e) => updateGeoRule(index, 'country', e.target.value)}
                          />
                          <Input 
                            placeholder="Redirect link (https://...)" 
                            type="url"
                            className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-border bg-background/40"
                            value={rule.targetUrl}
                            onChange={(e) => updateGeoRule(index, 'targetUrl', e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeGeoRule(index)} 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-center text-muted-foreground/80 italic py-2">
                      No geographical routing configured. All users will redirect to the primary URL.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>

        {lastShortened && (
          <div className="mt-4 p-4.5 bg-gradient-to-r from-primary/8 via-primary/4 to-accent/6 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-400">
            <div className="flex flex-col gap-1 overflow-hidden w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  Your Trimmed Link
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-hidden">
                <Link2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-heading font-extrabold text-base md:text-lg text-primary truncate">
                  {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000'}/{lastShortened.short_key}
                </span>
              </div>
            </div>
            
            <Button 
              variant="default" 
              onClick={copyToClipboard} 
              className={`w-full sm:w-auto px-5 h-10 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-md ${
                copied 
                  ? 'bg-emerald-600 text-white scale-102 hover:bg-emerald-600' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-102'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 shrink-0 animate-in zoom-in" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
