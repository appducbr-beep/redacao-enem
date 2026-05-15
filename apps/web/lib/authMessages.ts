const AUTH_ERROR_MAP: [string, string][] = [
  ['Email not confirmed', 'Você precisa confirmar seu e-mail antes de entrar.'],
  ['Invalid login credentials', 'E-mail ou senha inválidos.'],
  ['Email rate limit exceeded', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
  ['over_email_send_rate_limit', 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'],
  ['User already registered', 'Já existe uma conta com este e-mail.'],
  ['Password should be at least', 'A senha deve ter pelo menos 6 caracteres.'],
  ['Unable to validate email address', 'Endereço de e-mail inválido.'],
  ['Signup is disabled', 'Cadastros temporariamente desabilitados. Tente novamente mais tarde.'],
  ['Auth session missing', 'Sua sessão expirou. Solicite um novo link de redefinição de senha.'],
  ['New password should be different', 'A nova senha deve ser diferente da senha atual.'],
  ['Token has expired', 'Seu link expirou. Solicite um novo.'],
  ['For security purposes', 'Por segurança, aguarde alguns segundos antes de tentar novamente.'],
]

export function translateAuthError(message: string): string {
  const lower = message.toLowerCase()
  for (const [key, translation] of AUTH_ERROR_MAP) {
    if (lower.includes(key.toLowerCase())) return translation
  }
  return message
}
