export function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return digits
}

export function isValidOptionalPhone(raw: string): boolean {
  if (!raw || raw.trim() === '') return true
  const digits = sanitizePhone(raw)
  return digits.length >= 10 && digits.length <= 11
}
