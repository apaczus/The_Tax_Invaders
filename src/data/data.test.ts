import { describe, expect, it } from 'vitest'
import type { BuildingId, IndustryId } from '../types/game'
import { buildings, events, lessons, presets } from './index'

const buildingIds: BuildingId[] = ['liquidity', 'investing', 'taxes', 'growth']
const industryIds: IndustryId[] = ['gastronomy', 'ecommerce', 'it_services']

describe('dane gry', () => {
  it('ma wszystkie budynki z 3 poziomami bonusów', () => {
    expect(buildings.map((b) => b.id).sort()).toEqual([...buildingIds].sort())
    for (const b of buildings) expect(b.bonusPerLevel).toHaveLength(3)
  })

  it('ma presety dla 3 pokoleń i 3 branż', () => {
    expect(presets.generations).toHaveLength(3)
    expect(presets.industries.map((i) => i.id).sort()).toEqual([...industryIds].sort())
  })

  it('lekcje wskazują istniejące budynki i poprawną odpowiedź', () => {
    const ids = new Set<string>()
    for (const l of lessons) {
      expect(ids.has(l.id), `zduplikowane id lekcji: ${l.id}`).toBe(false)
      ids.add(l.id)
      expect(buildingIds).toContain(l.buildingId)
      expect(l.question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(l.question.correctIndex).toBeLessThan(l.question.options.length)
    }
  })

  it('każda branża ma co najmniej 3 zdarzenia, id są unikalne', () => {
    const ids = new Set<string>()
    for (const e of events) {
      expect(ids.has(e.id), `zduplikowane id zdarzenia: ${e.id}`).toBe(false)
      ids.add(e.id)
      if (e.relatedBuilding) expect(buildingIds).toContain(e.relatedBuilding)
    }
    for (const industry of industryIds) {
      expect(events.filter((e) => e.industry === industry).length).toBeGreaterThanOrEqual(3)
    }
  })
})
