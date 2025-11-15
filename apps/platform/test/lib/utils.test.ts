import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      })
      expect(result).toBe('class1 class3')
    })

    it('should handle mixed input types', () => {
      const result = cn(
        'base',
        {
          'conditional': true,
          'hidden': false
        },
        ['array-class1', 'array-class2'],
        undefined,
        null,
        'final-class'
      )
      expect(result).toBe('base conditional array-class1 array-class2 final-class')
    })

    it('should handle Tailwind class conflicts', () => {
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2') // Later class should win
    })

    it('should handle complex Tailwind class merging', () => {
      const result = cn('bg-red-500 text-white', 'bg-blue-500')
      expect(result).toBe('text-white bg-blue-500') // twMerge keeps order of later classes for conflicts
    })

    it('should handle responsive classes', () => {
      const result = cn('p-4 md:p-8 lg:p-12')
      expect(result).toBe('p-4 md:p-8 lg:p-12')
    })

    it('should handle variant classes', () => {
      const result = cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'bg-primary text-primary-foreground shadow hover:bg-primary/90'
      )
      expect(result).toBe('inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90')
    })

    it('should handle no input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle only falsey values', () => {
      const result = cn(false, null, undefined, '', 0)
      expect(result).toBe('')
    })

    it('should handle duplicate classes', () => {
      const result = cn('class1', 'class2', 'class1')
      expect(result).toBe('class1 class2 class1') // clsx deduplicates, twMerge keeps order
    })
  })
})