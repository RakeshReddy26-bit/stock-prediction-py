import { describe, it, expect } from 'vitest'
import { validateCatalogImages } from '../src/data/clothingCatalog'

describe('validateCatalogImages', () => {
  it('returns true for the current clothing catalog', () => {
    expect(validateCatalogImages()).toBe(true)
  })
})
