export function generateErrorId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ERR-${datePart}-${randPart}`
}
