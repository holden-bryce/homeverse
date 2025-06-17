'use client'

import Heatmap from '@/components/maps/heatmap'

export default function TestHeatmapPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Heatmap Test Page</h1>
      <Heatmap 
        height={600}
        showControls={true}
      />
    </div>
  )
}