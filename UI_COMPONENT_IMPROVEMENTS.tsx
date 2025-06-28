// 🎨 HomeVerse UI Component Improvements
// Production-ready component implementations for critical UI/UX fixes

// ============================================
// 1. RESPONSIVE DASHBOARD LAYOUT
// ============================================

import React, { useState, useEffect } from 'react'
import { Menu, X, Search, Bell, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ResponsiveDashboardLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [pathname, isMobile])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-teal-600">HomeVerse</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none
        `}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-teal-600">HomeVerse</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            <SidebarNavigation userRole={user?.role} />
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-200">
            <UserMenu user={user} />
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={`
        flex-1 lg:ml-64 min-h-screen
        ${isMobile ? 'pt-16' : ''}
      `}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

// ============================================
// 2. ACCESSIBLE FORM COMPONENTS
// ============================================

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  helpText?: string
  children: React.ReactElement
}

export function AccessibleFormField({
  label,
  error,
  required,
  helpText,
  children
}: FormFieldProps) {
  const id = React.useId()
  const errorId = `${id}-error`
  const helpId = `${id}-help`

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': [
          error && errorId,
          helpText && helpId
        ].filter(Boolean).join(' ') || undefined,
        'aria-required': required,
        className: `${children.props.className || ''} ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
        }`
      })}

      {helpText && (
        <p id={helpId} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </div>
  )
}

// ============================================
// 3. SKELETON LOADING COMPONENTS
// ============================================

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              {[...Array(5)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <Skeleton className="h-4 w-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-t">
                {[...Array(5)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// 4. EMPTY STATE COMPONENTS
// ============================================

import { Plus, Search, FileText, Users, Home } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  )
}

// Specific empty states
export const EmptyStates = {
  Applicants: () => (
    <EmptyState
      icon={Users}
      title="No applicants yet"
      description="Start building your applicant database by adding your first applicant."
      action={
        <Link
          href="/dashboard/applicants/new"
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add First Applicant
        </Link>
      }
    />
  ),

  Projects: () => (
    <EmptyState
      icon={Home}
      title="No projects found"
      description="Create your first housing project to start matching with applicants."
      action={
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Project
        </Link>
      }
    />
  ),

  SearchResults: ({ searchTerm }: { searchTerm: string }) => (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search.`}
    />
  )
}

// ============================================
// 5. RESPONSIVE DATA TABLE
// ============================================

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => React.ReactNode
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
}

export function ResponsiveTable<T extends { id: string }>({
  data,
  columns,
  onRowClick
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm">
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white p-4 rounded-lg shadow
              ${onRowClick ? 'cursor-pointer hover:shadow-md' : ''}
            `}
          >
            {columns.map((column) => (
              <div key={String(column.key)} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-sm font-medium text-gray-600">{column.label}</span>
                <span className="text-sm text-gray-900">
                  {column.render
                    ? column.render(item[column.key], item)
                    : String(item[column.key])}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

// ============================================
// 6. ACCESSIBLE MODAL WITH FOCUS TRAP
// ============================================

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()

      // Trap focus
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
          )
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div
          ref={modalRef}
          className={`
            inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all
            sm:my-8 sm:w-full sm:align-middle ${sizeClasses[size]}
          `}
          tabIndex={-1}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                {title}
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ============================================
// 7. ENHANCED TOAST NOTIFICATIONS
// ============================================

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      className="fixed bottom-0 right-0 z-50 p-4 space-y-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastNotification({ type, title, message }: Toast) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  }

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`
        max-w-sm w-full pointer-events-auto overflow-hidden rounded-lg border shadow-lg
        ${colors[type]}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================
// 8. SEARCH WITH AUTOCOMPLETE
// ============================================

import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: 'applicant' | 'project' | 'document'
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      // Fetch search results
      fetchSearchResults(debouncedQuery).then(setResults)
      setIsOpen(true)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [debouncedQuery])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      // Navigate to selected result
      window.location.href = `/dashboard/${results[selectedIndex].type}/${results[selectedIndex].id}`
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search applicants, projects..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
          role="listbox"
        >
          {results.map((result, index) => (
            <a
              key={result.id}
              href={`/dashboard/${result.type}/${result.id}`}
              className={`
                block px-4 py-3 hover:bg-gray-50 cursor-pointer
                ${selectedIndex === index ? 'bg-teal-50' : ''}
              `}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mr-3
                  ${result.type === 'applicant' ? 'bg-blue-100 text-blue-600' : ''}
                  ${result.type === 'project' ? 'bg-green-100 text-green-600' : ''}
                  ${result.type === 'document' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                  {result.type === 'applicant' && <Users className="w-4 h-4" />}
                  {result.type === 'project' && <Home className="w-4 h-4" />}
                  {result.type === 'document' && <FileText className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{result.title}</p>
                  {result.subtitle && (
                    <p className="text-sm text-gray-500">{result.subtitle}</p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// Utility function (would be in a separate file)
async function fetchSearchResults(query: string): Promise<SearchResult[]> {
  // Replace with actual API call
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
  return response.json()
}