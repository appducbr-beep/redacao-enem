/**
 * Centraliza a validação de variáveis de ambiente no servidor.
 * Lança erro em build-time se uma var obrigatória estiver ausente.
 */

export function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${name}. ` +
        'Check .env.local (dev) or Vercel Environment Variables (prod).'
    )
  }
  return value
}

export function requirePublicEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required public environment variable: ${name}. ` +
        'Check .env.local (dev) or Vercel Environment Variables (prod).'
    )
  }
  return value
}
