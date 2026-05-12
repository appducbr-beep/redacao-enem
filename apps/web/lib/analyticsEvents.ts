export const ANALYTICS_EVENTS = [
  'signup_completed',
  'login_completed',
  'profile_updated',
  'essay_submitted',
  'ocr_started',
  'ocr_completed',
  'ocr_failed',
  'checkout_started',
  'subscription_confirmed',
  'subscription_cancelled',
  'subscription_cancel_scheduled',
  'cron_subscriptions_processed',
  'landing_viewed',
  'onboarding_started',
  'history_viewed',
  'evolution_viewed',
  'plans_viewed',
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export function isAllowedAnalyticsEvent(event: string): event is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(event)
}
