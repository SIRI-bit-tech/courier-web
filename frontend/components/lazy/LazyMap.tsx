import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LazyOpenStreetMap = dynamic(() => import('../OpenStreetMap').then(mod => ({ default: mod.OpenStreetMap })), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
})

export function LazyMap(props: any) {
  return (
    <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
      <LazyOpenStreetMap {...props} />
    </Suspense>
  )
}