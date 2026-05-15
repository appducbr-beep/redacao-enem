import { describe, it, expect } from 'vitest'
import { translateAuthError } from '@/lib/authMessages'

describe('translateAuthError', () => {
  it('translates "Email not confirmed"', () => {
    expect(translateAuthError('Email not confirmed')).toBe(
      'Você precisa confirmar seu e-mail antes de entrar.'
    )
  })

  it('translates "Invalid login credentials"', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('E-mail ou senha inválidos.')
  })

  it('translates "Email rate limit exceeded"', () => {
    expect(translateAuthError('Email rate limit exceeded')).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    )
  })

  it('translates "over_email_send_rate_limit"', () => {
    expect(translateAuthError('over_email_send_rate_limit')).toBe(
      'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    )
  })

  it('translates "User already registered"', () => {
    expect(translateAuthError('User already registered')).toBe(
      'Já existe uma conta com este e-mail.'
    )
  })

  it('translates "Password should be at least" (partial match)', () => {
    expect(translateAuthError('Password should be at least 6 characters.')).toBe(
      'A senha deve ter pelo menos 6 caracteres.'
    )
  })

  it('translates "Auth session missing"', () => {
    expect(translateAuthError('Auth session missing!')).toBe(
      'Sua sessão expirou. Solicite um novo link de redefinição de senha.'
    )
  })

  it('translates "New password should be different"', () => {
    expect(translateAuthError('New password should be different from the old password.')).toBe(
      'A nova senha deve ser diferente da senha atual.'
    )
  })

  it('translates "Token has expired"', () => {
    expect(translateAuthError('Token has expired or is invalid')).toBe(
      'Seu link expirou. Solicite um novo.'
    )
  })

  it('translates "For security purposes"', () => {
    expect(translateAuthError('For security purposes, please wait 60 seconds.')).toBe(
      'Por segurança, aguarde alguns segundos antes de tentar novamente.'
    )
  })

  it('is case-insensitive', () => {
    expect(translateAuthError('email not confirmed')).toBe(
      'Você precisa confirmar seu e-mail antes de entrar.'
    )
  })

  it('returns original message for unknown errors', () => {
    const unknown = 'Some completely unknown error message'
    expect(translateAuthError(unknown)).toBe(unknown)
  })

  it('returns empty string as-is', () => {
    expect(translateAuthError('')).toBe('')
  })
})
