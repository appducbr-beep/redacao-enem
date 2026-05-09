import { describe, it, expect } from 'vitest'
import { formatCpf, sanitizeCpf, isValidCpfLength } from '@/lib/cpfUtils'

describe('formatCpf', () => {
  it('CPF com máscara formatado corretamente', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01')
  })

  it('CPF já com máscara → reforça formato', () => {
    expect(formatCpf('123.456.789-01')).toBe('123.456.789-01')
  })

  it('entrada parcial (3 dígitos) → sem pontuação', () => {
    expect(formatCpf('123')).toBe('123')
  })

  it('entrada parcial (4–6 dígitos) → primeiro ponto', () => {
    expect(formatCpf('123456')).toBe('123.456')
  })

  it('entrada parcial (7–9 dígitos) → dois pontos', () => {
    expect(formatCpf('123456789')).toBe('123.456.789')
  })

  it('trunca em 11 dígitos quando entrada maior', () => {
    expect(formatCpf('123456789012345')).toBe('123.456.789-01')
  })

  it('entrada vazia → string vazia', () => {
    expect(formatCpf('')).toBe('')
  })
})

describe('sanitizeCpf', () => {
  it('remove pontos e hífen', () => {
    expect(sanitizeCpf('123.456.789-01')).toBe('12345678901')
  })

  it('entrada já limpa → retorna igual', () => {
    expect(sanitizeCpf('12345678901')).toBe('12345678901')
  })

  it('entrada vazia → string vazia', () => {
    expect(sanitizeCpf('')).toBe('')
  })
})

describe('isValidCpfLength', () => {
  it('CPF com 11 dígitos → válido', () => {
    expect(isValidCpfLength('12345678901')).toBe(true)
  })

  it('CPF com máscara e 11 dígitos → válido', () => {
    expect(isValidCpfLength('123.456.789-01')).toBe(true)
  })

  it('CPF com 10 dígitos → inválido', () => {
    expect(isValidCpfLength('1234567890')).toBe(false)
  })

  it('CPF com 12 dígitos → inválido', () => {
    expect(isValidCpfLength('123456789012')).toBe(false)
  })

  it('CPF vazio → inválido', () => {
    expect(isValidCpfLength('')).toBe(false)
  })
})
