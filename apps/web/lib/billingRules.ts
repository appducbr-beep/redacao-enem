const GUARANTEE_DAYS = 7
const PRO_CREDITS = 20
const FREE_CREDITS = 3

export function isWithinGuaranteePeriod(startDate: Date, now: Date): boolean {
  return now.getTime() - startDate.getTime() <= GUARANTEE_DAYS * 86_400_000
}

export function getPeriodEnd(startDate: Date, billingCycle: 'monthly' | 'yearly'): Date {
  const end = new Date(startDate)
  if (billingCycle === 'yearly') {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

export function getNextCreditResetDate(
  startDate: Date,
  billingCycle: 'monthly' | 'yearly'
): Date | null {
  if (billingCycle !== 'yearly') return null
  const reset = new Date(startDate)
  reset.setMonth(reset.getMonth() + 1)
  return reset
}

export function getCreditBalanceAfterProActivation(): number {
  return PRO_CREDITS
}

export function getCreditBalanceAfterFreeDowngrade(): number {
  return FREE_CREDITS
}

export function shouldCancelImmediately(startDate: Date | null, now: Date): boolean {
  if (!startDate) return true
  return isWithinGuaranteePeriod(startDate, now)
}

export function shouldKeepAccessUntilPeriodEnd(startDate: Date | null, now: Date): boolean {
  if (!startDate) return false
  return !isWithinGuaranteePeriod(startDate, now)
}
