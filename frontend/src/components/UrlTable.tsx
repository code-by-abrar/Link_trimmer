"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { URLInfo } from '@/lib/api'
import { ExternalLink, BarChart3, Copy, Calendar, ShieldAlert, Globe, CheckCircle2, AlertTriangle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function UrlTable({ urls, onShowAnalytics }: { urls: URLInfo[], onShowAnalytics?: (shortKey: string) => void }) {
  const getFullUrl = (shortKey: string) => {
    const host = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000'
    return `${host}/${shortKey}`
  }

  const copyToClipboard = (shortKey: string) => {
    const fullUrl = getFullUrl(shortKey)
    navigator.clipboard.writeText(fullUrl)
    toast.success('Link copied to clipboard!')
  }

  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-card/30 backdrop-blur-sm rounded-2xl border border-dashed border-primary/25 min-h-[220px] transition-all">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 animate-pulse">
          <Inbox className="w-5 h-5" />
        </div>
        <h3 className="font-heading font-bold text-sm text-foreground">No links trimmed yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-normal">
          Paste your first long URL in the field above to trim it down and start tracking detailed engagement analytics!
        </p>
      </div>
    )
  }

  const isExpired = (expiry?: string) => {
    if (!expiry) return false
    return new Date(expiry) < new Date()
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto w-full">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/30 border-b border-border/40 select-none">
            <TableRow>
              <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider text-muted-foreground h-11 py-3 px-4">Original Destination</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-11 py-3 px-4">Short Redirect Link</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground h-11 py-3 px-4">Rules / Status</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground h-11 py-3 px-4">Clicks</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground h-11 py-3 px-4">Analytics & Copy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.map((url) => {
              const expired = isExpired(url.expires_at)
              const limitReached = url.max_clicks ? url.clicks_count >= url.max_clicks : false
              const fullRedirectUrl = getFullUrl(url.short_key)
              
              return (
                <TableRow 
                  key={url.short_key} 
                  className={`group border-b border-border/30 hover:bg-muted/20 active:bg-muted/10 transition-all duration-200 ${
                    expired || limitReached ? 'opacity-55 bg-muted/10' : ''
                  }`}
                >
                  {/* Original Destination */}
                  <TableCell className="py-4 px-4 align-middle">
                    <div className="flex flex-col gap-1 max-w-[280px]">
                      <span className="text-sm font-semibold truncate text-foreground/90 group-hover:text-primary transition-colors" title={url.original_url}>
                        {url.original_url}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                        Created {new Date(url.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </TableCell>

                  {/* Short Link */}
                  <TableCell className="py-4 px-4 align-middle">
                    <a
                      href={fullRedirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-heading font-extrabold text-sm hover:underline inline-flex items-center gap-1 hover:opacity-85 select-none"
                    >
                      <span>{url.short_key}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </TableCell>

                  {/* Rules / Status */}
                  <TableCell className="py-4 px-4 align-middle">
                    <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                      {expired && (
                        <Badge variant="destructive" className="h-5 px-1.5 gap-1 text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          Expired
                        </Badge>
                      )}
                      {limitReached && (
                        <Badge variant="destructive" className="h-5 px-1.5 gap-1 text-[9px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                          <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                          Limit Met
                        </Badge>
                      )}
                      {!expired && !limitReached && (
                        <Badge variant="secondary" className="h-5 px-1.5 gap-1 text-[9px] font-bold uppercase tracking-wider rounded-lg border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-400/10 border-emerald-500/20 shadow-sm">
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                          Active
                        </Badge>
                      )}
                      
                      {url.expires_at && !expired && (
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold rounded-lg border-border/80 bg-background/30 text-muted-foreground select-none">
                          <Calendar className="w-2.5 h-2.5 shrink-0 text-primary" />
                          {new Date(url.expires_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                      {url.max_clicks && (
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold rounded-lg border-border/80 bg-background/30 text-muted-foreground select-none">
                          <ShieldAlert className="w-2.5 h-2.5 shrink-0 text-primary" />
                          Max {url.max_clicks}
                        </Badge>
                      )}
                      {url.routing_config && (
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[9px] font-bold rounded-lg border-border/80 bg-background/30 text-muted-foreground select-none">
                          <Globe className="w-2.5 h-2.5 shrink-0 text-primary" />
                          Geo-routed
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Clicks */}
                  <TableCell className="py-4 px-4 text-right align-middle font-mono font-extrabold text-sm md:text-base">
                    <div className="inline-flex items-center justify-end gap-1.5 text-primary">
                      <BarChart3 className="w-4 h-4 shrink-0 text-primary" />
                      <span>{url.clicks_count}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 px-4 text-right align-middle select-none">
                    <div className="flex justify-end gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onShowAnalytics?.(url.short_key)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all"
                        title="View Detailed Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => copyToClipboard(url.short_key)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all"
                        title="Copy Short URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
