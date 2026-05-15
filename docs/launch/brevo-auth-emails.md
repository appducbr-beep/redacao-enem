# Brevo — E-mails de Autenticação via Supabase

## Visão geral

Existem dois usos distintos do Brevo no projeto:

| Uso | Responsável | Credencial |
|---|---|---|
| E-mails transacionais de produto (boas-vindas, assinatura, cancelamento) | `lib/brevo.ts` | `BREVO_API_KEY` (API REST) |
| E-mails de autenticação (confirmação, reset de senha) | Supabase Auth via SMTP customizado | Credenciais SMTP do Brevo |

**Importante:** são credenciais diferentes. O `BREVO_API_KEY` que o app usa é a chave da API REST. O SMTP do Supabase usa usuário/senha SMTP, gerado separadamente no painel do Brevo.

---

## Por que usar SMTP customizado no Supabase?

Por padrão, o Supabase envia e-mails de autenticação (confirmação e reset) pelo servidor deles, com remetente `noreply@mail.app.supabase.io`. Isso:

- Parece não profissional para o usuário
- Cai em spam com mais frequência
- Não usa o domínio da marca (reda1000.app.br)

Configurando SMTP customizado, o Supabase envia esses e-mails via Brevo, usando `no-reply@reda1000.app.br` como remetente.

---

## Configurar SMTP do Brevo para o Supabase

### 1. Obter credenciais SMTP no Brevo

1. Acesse app.brevo.com → **SMTP & API** → **SMTP**
2. Copie:
   - **SMTP Server:** `smtp-relay.brevo.com`
   - **Port:** `587` (TLS) ou `465` (SSL)
   - **Login (usuário):** seu e-mail de conta Brevo (ex: `contato@reda1000.app.br`)
   - **Password:** a senha SMTP gerada pelo Brevo (diferente da senha da conta)

> A senha SMTP é gerada em Brevo → SMTP & API → SMTP → "Generate a new SMTP key"

### 2. Verificar domínio no Brevo

Antes de enviar e-mails com `no-reply@reda1000.app.br`, o domínio `reda1000.app.br` precisa estar verificado no Brevo:

1. Brevo → **Senders & Domains** → **Domains** → Add a domain
2. Adicionar `reda1000.app.br`
3. Configurar registros DNS:
   - **TXT (SPF):** `v=spf1 include:spf.brevo.com mx ~all`
   - **TXT (DKIM):** fornecido pelo Brevo (chave específica para seu domínio)
4. Aguardar propagação DNS (pode levar até 48h)
5. Verificar no painel Brevo → status "Authenticated"

### 3. Configurar SMTP no Supabase Dashboard

1. **Supabase Dashboard** → **Authentication** → **SMTP Settings**
2. Ativar **"Enable Custom SMTP"**
3. Preencher:

| Campo | Valor |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | e-mail da conta Brevo |
| Password | senha SMTP do Brevo (não a senha da conta) |
| Sender Email | `no-reply@reda1000.app.br` |
| Sender Name | `Reda1000` |

4. Salvar e testar com "Send test email"

---

## Templates de e-mail (Supabase Dashboard)

Configurar em: **Authentication** → **Email Templates**

### Confirm signup

**Subject:** `Confirme seu e-mail no Reda1000`

**Body (recomendado):**
```html
<h2>Confirme seu e-mail</h2>
<p>Olá! Obrigado por criar sua conta no Reda1000.</p>
<p>Clique no link abaixo para confirmar seu endereço de e-mail:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar e-mail</a></p>
<p>Se você não criou uma conta, pode ignorar este e-mail.</p>
<p>— Equipe Reda1000</p>
```

### Reset password

**Subject:** `Redefina sua senha no Reda1000`

**Body (recomendado):**
```html
<h2>Redefinição de senha</h2>
<p>Recebemos uma solicitação para redefinir a senha da sua conta Reda1000.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir senha</a></p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou a redefinição, pode ignorar este e-mail.</p>
<p>— Equipe Reda1000</p>
```

> **Nota:** `{{ .ConfirmationURL }}` é o placeholder do Supabase — ele gera automaticamente a URL correta incluindo o código de verificação e o redirect para `/auth/callback?next=/reset-password`.

---

## Diferença entre os dois tipos de e-mail

### E-mails transacionais de produto (`lib/brevo.ts`)

- Disparados pelo app via Brevo API REST
- Credencial: `BREVO_API_KEY` no `.env.local` / Vercel
- Eventos: boas-vindas, assinatura Pro confirmada, cancelamento
- Completamente sob controle do app

### E-mails de autenticação (Supabase → Brevo SMTP)

- Disparados pelo Supabase automaticamente
- Credencial: SMTP configurada no Supabase Dashboard (não no app)
- Eventos: confirmação de e-mail, reset de senha
- Template configurado no Supabase Dashboard
- O app apenas configura `redirectTo` no `forgotPassword` action

---

## Checklist de configuração

- [ ] Criar conta Brevo (se ainda não existir)
- [ ] Verificar domínio `reda1000.app.br` no Brevo (SPF + DKIM)
- [ ] Gerar senha SMTP no Brevo
- [ ] Configurar SMTP no Supabase → Authentication → SMTP Settings
- [ ] Testar envio via "Send test email" no Supabase
- [ ] Customizar templates de e-mail em Supabase → Email Templates
- [ ] Testar fluxo de confirmação end-to-end
- [ ] Testar fluxo de reset de senha end-to-end
- [ ] Configurar `BREVO_API_KEY` (API REST) no Vercel para e-mails transacionais

---

## Ordem de prioridade no go-live

1. **SMTP customizado** (Supabase → Brevo) — deve ser feito antes do lançamento para que confirmação e reset cheguem em português e com o domínio correto
2. **`BREVO_API_KEY`** (e-mails transacionais) — pode ser feito em paralelo; sem a chave, o sistema funciona normalmente (sem lançar erros)
