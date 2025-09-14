declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function reportWebVitals(metric: any) {
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    })
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric)
  }
}

// Core Web Vitals thresholds
export const VITALS_THRESHOLDS = {
  LCP: 2500, // ms
  FID: 100,  // ms
  CLS: 0.1,  // score
  FCP: 1800, // ms
  TTFB: 800, // ms
}