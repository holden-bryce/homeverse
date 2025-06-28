'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  helpText?: string
  children: React.ReactElement
}

export function FormField({
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
        <div
          id={errorId}
          className="mt-1 flex items-center text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Enhanced Input component with built-in validation states
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 
          border rounded-md 
          focus:outline-none focus:ring-2 focus:ring-offset-2
          placeholder-gray-400
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-teal-500'
          }
          ${className || ''}
        `}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

// Enhanced Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 
          border rounded-md 
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-teal-500'
          }
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

// Enhanced Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2 
          border rounded-md 
          focus:outline-none focus:ring-2 focus:ring-offset-2
          placeholder-gray-400
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-300 focus:ring-teal-500'
          }
          ${className || ''}
        `}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'