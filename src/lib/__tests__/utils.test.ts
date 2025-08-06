import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500')
    expect(result).toBe('px-4 py-2 bg-blue-500')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    )
    
    expect(result).toBe('base-class active-class')
  })

  it('merges conflicting Tailwind classes correctly', () => {
    // twMerge should resolve conflicts by keeping the last one
    const result = cn('px-4', 'px-6')
    expect(result).toBe('px-6')
  })

  it('handles arrays of classes', () => {
    const result = cn(['px-4', 'py-2'], ['bg-blue-500', 'text-white'])
    expect(result).toBe('px-4 py-2 bg-blue-500 text-white')
  })

  it('handles objects with conditional classes', () => {
    const result = cn({
      'base-class': true,
      'active-class': true,
      'disabled-class': false,
    })
    
    expect(result).toBe('base-class active-class')
  })

  it('handles mixed input types', () => {
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      {
        'object-class-1': true,
        'object-class-2': false,
      },
      'final-class'
    )
    
    expect(result).toBe('base-class array-class-1 array-class-2 object-class-1 final-class')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
    expect(cn(null)).toBe('')
    expect(cn(undefined)).toBe('')
    expect(cn(false)).toBe('')
  })

  it('handles complex Tailwind class conflicts', () => {
    const result = cn(
      'bg-red-500',
      'bg-blue-500',
      'p-4',
      'px-6',
      'text-sm',
      'text-lg'
    )
    
    // Should resolve conflicts: bg-blue-500 (last bg), px-6 (overrides p-4 for x-axis), text-lg (last text size)
    expect(result).toBe('bg-blue-500 p-4 px-6 text-lg')
  })

  it('preserves non-conflicting classes', () => {
    const result = cn(
      'flex',
      'items-center',
      'justify-between',
      'w-full',
      'h-10'
    )
    
    expect(result).toBe('flex items-center justify-between w-full h-10')
  })

  it('handles responsive and state variants', () => {
    const result = cn(
      'text-sm',
      'md:text-lg',
      'hover:text-blue-500',
      'focus:outline-none',
      'disabled:opacity-50'
    )
    
    expect(result).toBe('text-sm md:text-lg hover:text-blue-500 focus:outline-none disabled:opacity-50')
  })

  it('handles dark mode variants', () => {
    const result = cn(
      'bg-white',
      'dark:bg-gray-900',
      'text-black',
      'dark:text-white'
    )
    
    expect(result).toBe('bg-white dark:bg-gray-900 text-black dark:text-white')
  })

  it('works with component variant patterns', () => {
    const variant = 'primary'
    const size = 'lg'
    
    const result = cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
      },
      {
        'h-10 px-4 py-2': size === 'default',
        'h-11 rounded-md px-8': size === 'lg',
        'h-9 rounded-md px-3': size === 'sm',
      }
    )
    
    expect(result).toContain('bg-primary')
    expect(result).toContain('h-11')
    expect(result).toContain('px-8')
  })
})
