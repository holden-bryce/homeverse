'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Maximize2, 
  MoreHorizontal, 
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Advanced Donut Chart with D3
interface DonutChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  width?: number
  height?: number
  innerRadius?: number
  outerRadius?: number
  showLegend?: boolean
  showLabels?: boolean
  title?: string
  description?: string
}

export function DonutChart({ 
  data, 
  width = 400, 
  height = 400, 
  innerRadius = 60, 
  outerRadius = 150,
  showLegend = true,
  showLabels = true,
  title,
  description 
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  
  const colors = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(data.map(d => d.color || d3.schemeCategory10[data.indexOf(d) % 10]))

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const radius = Math.min(width, height) / 2 - Math.max(margin.top, margin.right, margin.bottom, margin.left)

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

    const pie = d3.pie<any>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    const labelArc = d3.arc()
      .innerRadius(outerRadius + 10)
      .outerRadius(outerRadius + 10)

    const arcs = g.selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")

    // Add paths with animation
    arcs.append("path")
      .attr("d", arc as any)
      .attr("fill", d => colors(d.data.label) as string)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("opacity", 0.8)
      .transition()
      .duration(750)
      .attrTween("d", function(d: any) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return function(t) {
          return arc(interpolate(t)) as string
        }
      })

    // Add hover effects
    arcs.selectAll("path")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("transform", `scale(1.05)`)
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("transform", `scale(1)`)
      })

    // Add labels if enabled
    if (showLabels) {
      arcs.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d as any)})`)
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "500")
        .style("fill", "#374151")
        .text(d => `${d.data.label} (${d.data.value})`)
        .style("opacity", 0)
        .transition()
        .delay(750)
        .duration(500)
        .style("opacity", 1)
    }

    // Add center total
    const total = data.reduce((sum, d) => sum + d.value, 0)
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#111827")
      .text(total.toLocaleString())
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1)

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.5em")
      .style("font-size", "14px")
      .style("fill", "#6b7280")
      .text("Total")
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1)

  }, [data, width, height, innerRadius, outerRadius, showLabels, colors])

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      
      <div className="flex items-start space-x-6">
        <svg ref={svgRef}></svg>
        
        {showLegend && (
          <div className="space-y-2 min-w-0 flex-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Breakdown</h4>
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color || colors(item.label) as string }}
                />
                <span className="text-sm text-gray-600 flex-1 truncate">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{item.value.toLocaleString()}</span>
                <span className="text-xs text-gray-500">
                  {((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Advanced Heatmap Chart
interface HeatmapProps {
  data: Array<{
    x: string
    y: string
    value: number
  }>
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  title?: string
  description?: string
}

export function Heatmap({ 
  data, 
  width = 600, 
  height = 400, 
  margin = { top: 20, right: 20, bottom: 40, left: 80 },
  title,
  description 
}: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const xValues = Array.from(new Set(data.map(d => d.x)))
    const yValues = Array.from(new Set(data.map(d => d.y)))

    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleBand()
      .domain(yValues)
      .range([0, innerHeight])
      .padding(0.1)

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain(d3.extent(data, d => d.value) as [number, number])

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)

    // Add rectangles
    g.selectAll(".cell")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.x)!)
      .attr("y", d => yScale(d.y)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .style("opacity", 0)
      .transition()
      .duration(750)
      .delay((d, i) => i * 50)
      .style("opacity", 0.8)

    // Add hover effects and tooltips
    g.selectAll(".cell")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("stroke-width", 2)
          .attr("stroke", "#374151")
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("stroke-width", 1)
          .attr("stroke", "#ffffff")
      })

    // Add text labels
    g.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => xScale(d.x)! + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.y)! + yScale.bandwidth() / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", d => d3.lab(colorScale(d.value)).l > 50 ? "#374151" : "#ffffff")
      .text(d => d.value.toFixed(1))
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1)

    // Add x-axis
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280")

    // Add y-axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6b7280")

  }, [data, width, height, margin])

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <svg ref={svgRef}></svg>
    </div>
  )
}

// Advanced Treemap Chart
interface TreemapProps {
  data: {
    name: string
    children: Array<{
      name: string
      value: number
      color?: string
    }>
  }
  width?: number
  height?: number
  title?: string
  description?: string
}

export function Treemap({ 
  data, 
  width = 600, 
  height = 400,
  title,
  description 
}: TreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.children.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const root = d3.hierarchy(data)
      .sum(d => (d as any).value || 0)
      .sort((a, b) => ((b.data as any).value || 0) - ((a.data as any).value || 0))

    const treemap = d3.treemap<any>()
      .size([width, height])
      .padding(2)
      .round(true)

    treemap(root as any)

    const colorScale = d3.scaleOrdinal()
      .domain(data.children.map(d => d.name))
      .range(d3.schemeSet3)

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")

    const leaves = g.selectAll(".leaf")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("class", "leaf")
      .attr("transform", (d: any) => `translate(${d.x0}, ${d.y0})`)

    // Add rectangles
    leaves.append("rect")
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("fill", (d: any) => d.data.color || colorScale(d.data.name) as string)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("rx", 4)
      .style("opacity", 0.8)
      .transition()
      .duration(750)
      .delay((d, i) => i * 100)
      .style("opacity", 1)

    // Add hover effects
    leaves.selectAll("rect")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.9)
          .attr("stroke-width", 3)
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("stroke-width", 2)
      })

    // Add text labels
    leaves.append("text")
      .attr("x", 4)
      .attr("y", 16)
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text((d: any) => d.data.name)
      .style("opacity", 0)
      .transition()
      .delay(1000)
      .duration(500)
      .style("opacity", 1)

    leaves.append("text")
      .attr("x", 4)
      .attr("y", 32)
      .style("font-size", "10px")
      .style("fill", "#6b7280")
      .text((d: any) => d.data.value?.toLocaleString())
      .style("opacity", 0)
      .transition()
      .delay(1200)
      .duration(500)
      .style("opacity", 1)

  }, [data, width, height])

  return (
    <div className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      )}
      <svg ref={svgRef}></svg>
    </div>
  )
}

// Advanced Gauge Chart
interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  title?: string
  subtitle?: string
  thresholds?: Array<{
    value: number
    color: string
    label?: string
  }>
  width?: number
  height?: number
}

export function GaugeChart({ 
  value, 
  min = 0, 
  max = 100, 
  title, 
  subtitle,
  thresholds = [
    { value: 30, color: "#ef4444", label: "Poor" },
    { value: 60, color: "#f59e0b", label: "Fair" },
    { value: 80, color: "#eab308", label: "Good" },
    { value: 100, color: "#22c55e", label: "Excellent" }
  ],
  width = 300,
  height = 200
}: GaugeChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const radius = Math.min(width, height * 2) / 2 - 20
    const centerX = width / 2
    const centerY = height - 20

    const angleScale = d3.scaleLinear()
      .domain([min, max])
      .range([-Math.PI/2, Math.PI/2])

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`)

    // Background arc
    const backgroundArc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI/2)
      .endAngle(Math.PI/2)

    g.append("path")
      .attr("d", backgroundArc as any)
      .attr("fill", "#e5e7eb")

    // Threshold arcs
    let currentAngle = -Math.PI/2
    thresholds.forEach((threshold, index) => {
      const nextAngle = angleScale(threshold.value)
      
      const arc = d3.arc()
        .innerRadius(radius - 20)
        .outerRadius(radius)
        .startAngle(currentAngle)
        .endAngle(nextAngle)

      g.append("path")
        .attr("d", arc as any)
        .attr("fill", threshold.color)
        .style("opacity", 0)
        .transition()
        .duration(750)
        .delay(index * 200)
        .style("opacity", 0.8)

      currentAngle = nextAngle
    })

    // Value indicator
    const valueAngle = angleScale(value)
    const needleLength = radius - 30
    
    const needlePath = `M 0,${-needleLength} L 3,0 L 0,10 L -3,0 Z`
    
    g.append("path")
      .attr("d", needlePath)
      .attr("fill", "#374151")
      .attr("transform", `rotate(${(valueAngle * 180 / Math.PI) + 90})`)
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1)

    // Center circle
    g.append("circle")
      .attr("r", 8)
      .attr("fill", "#374151")

    // Value text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-1.2em")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#111827")
      .text(value.toFixed(1))
      .style("opacity", 0)
      .transition()
      .delay(1200)
      .duration(500)
      .style("opacity", 1)

    if (subtitle) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.2em")
        .style("font-size", "12px")
        .style("fill", "#6b7280")
        .text(subtitle)
        .style("opacity", 0)
        .transition()
        .delay(1400)
        .duration(500)
        .style("opacity", 1)
    }

  }, [value, min, max, thresholds, width, height, subtitle])

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 text-center">{title}</h3>
      )}
      <div className="flex flex-col items-center">
        <svg ref={svgRef}></svg>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {thresholds.map((threshold, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: threshold.color }}
              />
              <span className="text-xs text-gray-600">
                {threshold.label} ({index === 0 ? min : thresholds[index - 1]?.value || 0}-{threshold.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Interactive Chart Card wrapper
interface InteractiveChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  refreshAction?: () => void
  downloadAction?: () => void
  fullscreenAction?: () => void
  className?: string
}

export function InteractiveChartCard({
  title,
  description,
  children,
  actions,
  refreshAction,
  downloadAction,
  fullscreenAction,
  className = ""
}: InteractiveChartCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!refreshAction) return
    setIsRefreshing(true)
    await refreshAction()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-gray-600">
              {description}
            </CardDescription>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {actions}
          {refreshAction && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {downloadAction && (
            <Button variant="outline" size="sm" onClick={downloadAction}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          {fullscreenAction && (
            <Button variant="outline" size="sm" onClick={fullscreenAction}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}