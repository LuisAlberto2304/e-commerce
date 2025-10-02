/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function PerformanceMetrics() {
  useReportWebVitals((metric) => {
    // 🔹 Enviar métricas a tu servicio de analytics
    if (process.env.NODE_ENV === 'development') {
      console.log(metric)
    }

    // Ejemplo: enviar a Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  })

  return null
}