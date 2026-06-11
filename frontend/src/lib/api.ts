import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface URLInfo {
  original_url: string;
  short_key: string;
  created_at: string;
  expires_at?: string;
  max_clicks?: number;
  routing_config?: Record<string, string>;
  clicks_count: number;
}

export interface ShortenOptions {
  expires_at?: string;
  max_clicks?: number;
  routing_config?: Record<string, string>;
}

export const shortenUrl = async (url: string, options: ShortenOptions = {}): Promise<URLInfo> => {
  const response = await api.post('/shorten', { 
    original_url: url,
    ...options
  });
  return response.data;
};

export const getUrls = async (): Promise<URLInfo[]> => {
  const response = await api.get('/urls');
  return response.data;
};

export interface AnalyticsSummary {
  total_clicks: number;
  unique_clicks: number;
  top_countries: Record<string, number>;
  top_sources: Record<string, number>;
  top_referrers: Record<string, number>;
}

export interface TimeSeriesPoint {
  time: string;
  clicks: number;
}

export interface AnalyticsReport {
  short_key: string;
  summary: AnalyticsSummary;
  time_series: TimeSeriesPoint[];
}

export const getAnalytics = async (shortKey: string): Promise<AnalyticsReport> => {
  const response = await api.get(`/analytics/${shortKey}`);
  return response.data;
};
