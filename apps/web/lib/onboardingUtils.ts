export type OnboardingStatus = 'not_started' | 'essay_sent' | 'correction_received'

export type EssayForOnboarding = { status: string }

export function hasUserSubmittedEssay(essays: EssayForOnboarding[]): boolean {
  return essays.length > 0
}

export function hasUserReceivedCorrection(essays: EssayForOnboarding[]): boolean {
  return essays.some((e) => e.status === 'done')
}

export function getOnboardingStatus(essays: EssayForOnboarding[]): OnboardingStatus {
  if (hasUserReceivedCorrection(essays)) return 'correction_received'
  if (hasUserSubmittedEssay(essays)) return 'essay_sent'
  return 'not_started'
}

export function shouldShowOnboarding(status: OnboardingStatus): boolean {
  return status !== 'correction_received'
}
