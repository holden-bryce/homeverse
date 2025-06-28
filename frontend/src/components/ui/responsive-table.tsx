'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  className?: string
  mobileHidden?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  keyExtractor?: (item: T) => string
  emptyState?: React.ReactNode
  loading?: boolean
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  emptyState,
  loading
}: ResponsiveTableProps<T>) {
  if (loading) {
    return <TableSkeleton columns={columns.length} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        {emptyState || (
          <div className="text-center text-gray-500">
            No data available
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {onRowClick && (
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item) : String(index)
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {columns.map((column) => {
                    const value = typeof column.key === 'string' 
                      ? getNestedValue(item, column.key)
                      : item[column.key]
                    
                    return (
                      <td 
                        key={String(column.key)} 
                        className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                      >
                        {column.render
                          ? column.render(value, item)
                          : String(value ?? '')}
                      </td>
                    )
                  })}
                  {onRowClick && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item) : String(index)
          const visibleColumns = columns.filter(col => !col.mobileHidden)
          
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(item)}
              className={`
                bg-white p-4 rounded-lg shadow
                ${onRowClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''}
              `}
            >
              {visibleColumns.map((column, colIndex) => {
                const value = typeof column.key === 'string' 
                  ? getNestedValue(item, column.key)
                  : item[column.key]
                
                return (
                  <div 
                    key={String(column.key)} 
                    className={`
                      flex justify-between py-2 
                      ${colIndex < visibleColumns.length - 1 ? 'border-b border-gray-100' : ''}
                    `}
                  >
                    <span className="text-sm font-medium text-gray-600">
                      {column.label}
                    </span>
                    <span className="text-sm text-gray-900 text-right ml-4">
                      {column.render
                        ? column.render(value, item)
                        : String(value ?? '')}
                    </span>
                  </div>
                )
              })}
              {onRowClick && (
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                  <ChevronRight className="w-5 h-5 text-teal-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Table Skeleton component
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t">
                {[...Array(columns)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex justify-between py-2 border-b last:border-0">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}