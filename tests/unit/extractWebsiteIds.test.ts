import { describe, it, expect } from 'vitest'

/**
 * Helper function to extract website IDs from user.websites array
 * Handles both populated objects and ID strings
 */
function extractWebsiteIds(websites: any[]): string[] {
  if (!websites) return []
  return websites
    .map((website) => {
      // Handle populated objects
      if (typeof website === 'object' && website !== null) {
        return website.id || website._id || website
      }
      // Handle ID strings
      return website
    })
    .filter(Boolean)
}

describe('extractWebsiteIds', () => {
  it('should extract IDs from array of ID strings', () => {
    const input = ['website-1', 'website-2', 'website-3']
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2', 'website-3'])
  })

  it('should extract IDs from array of objects with id property', () => {
    const input = [
      { id: 'website-1', name: 'Website 1' },
      { id: 'website-2', name: 'Website 2' },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2'])
  })

  it('should extract IDs from array of objects with _id property', () => {
    const input = [
      { _id: 'website-1', name: 'Website 1' },
      { _id: 'website-2', name: 'Website 2' },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2'])
  })

  it('should handle mixed array of IDs and objects', () => {
    const input = [
      'website-1',
      { id: 'website-2', name: 'Website 2' },
      'website-3',
      { id: 'website-4', name: 'Website 4' },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2', 'website-3', 'website-4'])
  })

  it('should handle empty array', () => {
    const input: any[] = []
    const result = extractWebsiteIds(input)

    expect(result).toEqual([])
  })

  it('should handle null/undefined input', () => {
    const result1 = extractWebsiteIds(null as any)
    const result2 = extractWebsiteIds(undefined as any)

    expect(result1).toEqual([])
    expect(result2).toEqual([])
  })

  it('should filter out null/undefined values from array', () => {
    const input = ['website-1', null, 'website-2', undefined, 'website-3']
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2', 'website-3'])
  })

  it('should handle objects with nested id properties', () => {
    const input = [
      { id: 'website-1', data: { nested: 'value' } },
      { id: 'website-2' },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1', 'website-2'])
  })

  it('should handle numeric IDs', () => {
    const input = [1, 2, 3]
    const result = extractWebsiteIds(input)

    expect(result).toEqual([1, 2, 3])
  })

  it('should handle objects with numeric id property', () => {
    const input = [
      { id: 1, name: 'Website 1' },
      { id: 2, name: 'Website 2' },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual([1, 2])
  })

  it('should prioritize id over _id when both exist', () => {
    const input = [{ id: 'website-1', _id: 'old-id' }]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1'])
  })

  it('should handle deeply populated objects', () => {
    const input = [
      {
        id: 'website-1',
        name: 'Website 1',
        settings: {
          logo: { id: 'logo-1' },
          colors: ['red', 'blue'],
        },
      },
    ]
    const result = extractWebsiteIds(input)

    expect(result).toEqual(['website-1'])
  })
})
