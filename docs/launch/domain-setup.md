# Configuração de Domínio — reda1000.app.br

## Domínio de produção

| | |
|---|---|
| **Domínio principal** | `https://reda1000.app.br` |
| **www** | `https://www.reda1000.app.br` → redireciona para apex |
| **Preview (sandbox)** | `https://redacao-enem-green.vercel.app` |

---

## 1. Adicionar domínio na Vercel

1. Vercel Dashboard → selecionar o projeto `reda1000`
2. **Settings → Domains**
3. Clicar em **Add Domain**
4. Adicionar `reda1000.app.br` → **Add**
   - Definir como domínio principal
5. Adicionar `www.reda1000.app.br` → **Add**
   - Na opção de configuração, selecionar **Redirect to `reda1000.app.br`**
6. A Vercel exibirá os registros DNS que precisam ser configurados no Registro.br

> **Confirmar os valores exatos no painel da Vercel** — os IPs e CNAMEs abaixo são os padrões, mas a Vercel pode exibir valores específicos para o seu projeto.

---

## 2. Configurar DNS no Registro.br

Acessar: [registro.br](https://registro.br) → Painel → `reda1000.app.br` → **DNS**

### Registro A (domínio raiz / apex)

| Tipo | Nome | Valor |
|---|---|---|
| `A` | `@` | `76.76.21.21` |

> Se o Registro.br não aceitar `@`, usar o domínio completo `reda1000.app.br.` com o ponto final.

### Registro CNAME (www)

| Tipo | Nome | Valor |
|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com.` |

> O ponto final (`.`) ao fim do CNAME é padrão DNS — incluir se o provedor exigir, omitir se não aceitar.

### TTL sugerido

`300` (5 minutos) durante a configuração inicial. Após confirmar funcionamento, pode aumentar para `3600`.

---

## 3. Aguardar propagação DNS

| Cenário | Tempo estimado |
|---|---|
| Registro A + CNAME configurados corretamente | 5–30 minutos |
| Propagação completa global | até 24–48 horas |
| SSL (HTTPS) ativado pela Vercel | automático após DNS propagar |

Ferramentas para verificar propagação:
- [dnschecker.org](https://dnschecker.org) → pesquisar `reda1000.app.br` tipo A
- [whatsmydns.net](https://whatsmydns.net)

---

## 4. Verificar na Vercel

No painel **Settings → Domains**, aguardar o status dos dois domínios ficar ✅:

| Domínio | Status esperado |
|---|---|
| `reda1000.app.br` | ✅ Valid Configuration |
| `www.reda1000.app.br` | ✅ Redirects to reda1000.app.br |

A Vercel provisiona o certificado SSL automaticamente via Let's Encrypt.

---

## 5. Testes manuais pós-configuração

Após DNS propagar e SSL ativo:

```bash
# Domínio principal — deve retornar 200 com conteúdo HTML
curl -I https://reda1000.app.br

# www deve retornar 308 redirect para apex
curl -I https://www.reda1000.app.br

# Login deve funcionar
https://reda1000.app.br/login

# Auth callback deve funcionar (após atualizar Supabase — ver abaixo)
https://reda1000.app.br/auth/callback
```

---

## 6. Configurações dependentes do domínio

Após o domínio estar ativo e com SSL, atualizar **na ordem abaixo**:

### 6a. Vercel — variável de ambiente (Production)

Em **Settings → Environment Variables**, alterar para o ambiente **Production**:

```
NEXT_PUBLIC_APP_URL=https://reda1000.app.br
```

Fazer **Redeploy** após salvar.

### 6b. Supabase Auth

**Supabase Dashboard → Authentication → URL Configuration**

```
Site URL:
  https://reda1000.app.br

Redirect URLs (manter todas):
  https://reda1000.app.br/auth/callback
  https://www.reda1000.app.br/auth/callback
  https://redacao-enem-green.vercel.app/auth/callback
  https://*.vercel.app/auth/callback
  http://localhost:3000/auth/callback
```

> Não remover `redacao-enem-green.vercel.app` imediatamente — preview deployments ainda usam essa URL.

### 6c. Asaas — webhook de produção

Quando migrar para `ASAAS_ENV=production`:

**Asaas Dashboard → Configurações → Integrações → Webhooks → Adicionar webhook**

```
URL:    https://reda1000.app.br/api/asaas/webhook
Token:  <ASAAS_WEBHOOK_TOKEN novo, gerado com openssl rand -hex 32>
```

Eventos:
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `SUBSCRIPTION_CANCELLED`
- `SUBSCRIPTION_DELETED`

> ⚠️ Não fazer isso ainda — manter sandbox até testes completos.

---

## Checklist completo

### DNS e Vercel
- [ ] Domínio `reda1000.app.br` adicionado na Vercel como principal
- [ ] `www.reda1000.app.br` adicionado com redirect para apex
- [ ] Registro A `@` → `76.76.21.21` configurado no Registro.br
- [ ] CNAME `www` → `cname.vercel-dns.com` configurado no Registro.br
- [ ] DNS propagado (verificar em dnschecker.org)
- [ ] Status ✅ na Vercel para ambos os domínios
- [ ] SSL ativo (cadeado verde em https://reda1000.app.br)
- [ ] `https://www.reda1000.app.br` redireciona para `https://reda1000.app.br`

### Variáveis de ambiente
- [ ] `NEXT_PUBLIC_APP_URL=https://reda1000.app.br` no ambiente **Production** da Vercel
- [ ] Redeploy feito após alterar variável

### Supabase Auth
- [ ] **Site URL** atualizado para `https://reda1000.app.br`
- [ ] `https://reda1000.app.br/auth/callback` na lista de Redirect URLs
- [ ] `https://www.reda1000.app.br/auth/callback` na lista de Redirect URLs
- [ ] Login e fluxo de e-mail testados no novo domínio

### Smoke tests
- [ ] `https://reda1000.app.br` carrega a landing page
- [ ] `https://reda1000.app.br/login` funciona
- [ ] Cadastro + confirmação de e-mail funciona com novo domínio
- [ ] Dashboard carrega após login

---

## Notas

- **Não alterar `ASAAS_ENV`** para `production` junto com o domínio — são passos independentes.
- O Preview `redacao-enem-green.vercel.app` continua funcionando após o domínio entrar em produção.
- O certificado SSL da Vercel renova automaticamente — não é necessário configurar manualmente.
- Se o Registro.br não suportar registro A para apex, usar o **Nameserver da Vercel** como alternativa (delegar DNS completo para a Vercel).
