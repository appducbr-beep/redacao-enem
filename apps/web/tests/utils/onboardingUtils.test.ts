import { describe, it, expect } from 'vitest'
import {
  hasUserSubmittedEssay,
  hasUserReceivedCorrection,
  getOnboardingStatus,
  shouldShowOnboarding,
} from '@/lib/onboardingUtils'

describe('hasUserSubmittedEssay', () => {
  it('returns false for empty essays', () => {
    expect(hasUserSubmittedEssay([])).toBe(false)
  })
  it('returns true for a pending essay', () => {
    expect(hasUserSubmittedEssay([{ status: 'pending' }])).toBe(true)
  })
  it('returns true for a done essay', () => {
    expect(hasUserSubmittedEssay([{ status: 'done' }])).toBe(true)
  })
  it('returns true for multiple essays', () => {
    expect(hasUserSubmittedEssay([{ status: 'pending' }, { status: 'done' }])).toBe(true)
  })
})

describe('hasUserReceivedCorrection', () => {
  it('returns false for empty essays', () => {
    expect(hasUserReceivedCorrection([])).toBe(false)
  })
  it('returns false when all essays are pending', () => {
    expect(hasUserReceivedCorrection([{ status: 'pending' }])).toBe(false)
  })
  it('returns true when at least one essay is done', () => {
    expect(hasUserReceivedCorrection([{ status: 'done' }])).toBe(true)
  })
  it('returns true when mixed pending and done', () => {
    expect(hasUserReceivedCorrection([{ status: 'pending' }, { status: 'done' }])).toBe(true)
  })
})

describe('getOnboardingStatus', () => {
  it('returns not_started for no essays', () => {
    expect(getOnboardingStatus([])).toBe('not_started')
  })
  it('returns essay_sent for pending essays only', () => {
    expect(getOnboardingStatus([{ status: 'pending' }])).toBe('essay_sent')
  })
  it('returns correction_received when any essay is done', () => {
    expect(getOnboardingStatus([{ status: 'done' }])).toBe('correction_received')
  })
  it('returns correction_received when mixed pending and done', () => {
    expect(getOnboardingStatus([{ status: 'pending' }, { status: 'done' }])).toBe('correction_received')
  })
  it('prioritizes correction_received over essay_sent', () => {
    const essays = [{ status: 'done' }, { status: 'pending' }, { status: 'done' }]
    expect(getOnboardingStatus(essays)).toBe('correction_received')
  })
})

describe('shouldShowOnboarding', () => {
  it('returns true for not_started', () => {
    expect(shouldShowOnboarding('not_started')).toBe(true)
  })
  it('returns true for essay_sent', () => {
    expect(shouldShowOnboarding('essay_sent')).toBe(true)
  })
  it('returns false for correction_received', () => {
    expect(shouldShowOnboarding('correction_received')).toBe(false)
  })
})
