# Reda1000 — Project Status

## Visão Geral

O Reda1000 é uma plataforma SaaS B2C focada em correção de redações estilo ENEM utilizando IA, OCR e análise estruturada baseada nos critérios oficiais do exame.

Stack principal:

* Frontend: Next.js 16 + TypeScript + Tailwind
* Banco/Auth: Supabase
* IA de correção: OpenAI (GPT-4o)
* OCR: Groq Vision
* Pagamentos: Asaas
* Deploy: Vercel

Objetivo atual:

Lançar uma V1 altamente funcional e confiável para estudantes individuais.

---

# Status Geral do Projeto

## Núcleo do Produto

| Funcionalidade             | Status      |
| -------------------------- | ----------- |
| Autenticação               | ✅ Concluído |
| Cadastro/Login             | ✅ Concluído |
| Recuperação de senha       | ✅ Concluído |
| Dashboard                  | ✅ Concluído |
| Temas de redação           | ✅ Concluído |
| Nova redação               | ✅ Concluído |
| Correção por IA            | ✅ Concluído |
| OCR manuscrito             | ✅ Concluído |
| Histórico                  | ✅ Concluído |
| Evolução                   | ✅ Concluído |
| Planos                     | ✅ Concluído |
| Asaas Sandbox              | ✅ Concluído |
| Webhook Asaas              | ✅ Concluído |
| Créditos                   | ✅ Concluído |
| Cancelamento de assinatura | ✅ Concluído |
| Deploy Vercel              | ✅ Concluído |

---

# Arquitetura Atual

## Frontend

### Stack

* Next.js 16 (App Router)
* React
* TypeScript
* TailwindCSS

### Estrutura principal

```txt
apps/web/
├── app/
├── components/
├── lib/
├── docs/
├── supabase/
```

---

# Sistema de Correção

## Modelo atual

### OpenAI

Modelo principal:

```txt
gpt-4o
```

### Estratégia de correção

A correção utiliza:

* 5 prompts especializados
* 1 prompt por competência do ENEM
* 1 síntese final
* chamadas paralelas via Promise.all

Competências:

* C1 — Norma culta
* C2 — Compreensão do tema
* C3 — Argumentação
* C4 — Coesão
* C5 — Proposta de intervenção

---

## Melhorias implementadas no sistema de IA

### Anti-alucinação

O sistema agora:

* exige trecho exato para apontar erro
* separa:

  * erro gramatical
  * melhoria de estilo
  * análise estrutural
* proíbe feedback genérico
* evita sugestões não relacionadas ao texto

---

## Estrutura atual da análise

Cada competência possui:

* nota
* pontos fortes
* onde perdeu pontos
* análise estrutural
* rubric_reasoning
* erros reais
* melhorias de estilo
* exemplo de reescrita

---

# OCR

## Status

✅ Funcionando

## Stack

Groq Vision

Modelo atual:

```txt
meta-llama/llama-4-scout-17b-16e-instruct
```

## Fluxo

1. Usuário envia imagem
2. OCR converte para texto
3. Usuário revisa manualmente
4. Texto segue para correção

## Regras

* OCR não consome créditos
* Correção consome créditos
* Usuário recebe aviso sobre possibilidade de erros de leitura

---

# Sistema de Créditos

## Regras atuais

### Free

* 3 créditos iniciais
* temas limitados

### Pro

* 20 redações por ciclo mensal
* créditos NÃO acumulativos
* renovação redefine saldo para 20

---

## Implementação

Função SQL:

```sql
public.set_credit_balance(
  target_user_id uuid,
  available_credits integer,
  reason text
)
```

### Comportamento

* redefine credits_available
* registra auditoria em credit_transactions
* evita acúmulo indevido
* idempotente

---

# Pagamentos

## Gateway

Asaas

## Ambiente atual

```txt
sandbox
```

## Funcionalidades implementadas

| Funcionalidade        | Status |
| --------------------- | ------ |
| Criação de customer   | ✅      |
| Criação de assinatura | ✅      |
| Checkout              | ✅      |
| Webhook               | ✅      |
| Ativação do plano     | ✅      |
| Créditos automáticos  | ✅      |
| Cancelamento          | ✅      |
| Idempotência          | ✅      |

---

## Eventos ativos no webhook

* PAYMENT_CONFIRMED
* SUBSCRIPTION_CREATED
* SUBSCRIPTION_UPDATED
* SUBSCRIPTION_CANCELLED

---

## Segurança do webhook

Header validado:

```txt
asaas-access-token
```

Variável:

```env
ASAAS_WEBHOOK_TOKEN
```

---

# UX Atual

## Dashboard

Implementado:

* saudação personalizada
* métricas principais
* últimas redações
* evolução
* CTA para planos
* aviso de créditos

---

## Página de resultado

Status:

✅ Muito avançada

Componentes:

* ScoreHero
* barras por competência
* prioridade de melhorias
* erros reais destacados
* melhorias de estilo
* análise estrutural
* exemplos de reescrita

---

## Página de evolução

Implementado:

* gráfico SVG responsivo
* médias por competência
* melhor nota
* evolução temporal
* diagnóstico geral

---

## Página de planos

Implementado:

* plano Free
* plano Pro mensal
* plano Pro anual
* CTA integrado
* modal CPF
* cancelamento do plano

Pendência:

* refinamento visual final

---

# Banco de Dados

## Supabase

### Principais tabelas

* profiles
* essays
* essay_topics
* essay_corrections
* subscriptions
* asaas_payments
* webhook_logs
* credit_wallets
* credit_transactions

---

## Segurança

* RLS ativado
* policies implementadas
* service_role apenas server-side

---

# Deploy

## Plataforma

Vercel

## Ambiente atual

Produção sandbox:

```txt
https://redacao-enem-green.vercel.app
```

---

# Variáveis de Ambiente

## Principais

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

GROQ_API_KEY=
GROQ_VISION_MODEL=

ASAAS_ENV=sandbox
ASAAS_API_KEY=
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_WEBHOOK_TOKEN=
```

---

# Decisões Arquiteturais Importantes

## IA

### Decisão

Migrar de Groq para OpenAI na correção.

### Motivo

* maior consistência
* menor alucinação
* melhor aderência ao ENEM

---

## OCR

### Decisão

Manter Groq Vision.

### Motivo

* OCR eficiente
* baixo custo
* integração simples

---

## Créditos

### Decisão

Não acumular créditos do Pro.

### Motivo

* proteção de custo operacional
* previsibilidade financeira
* prevenção contra heavy users

---

## CPF

### Decisão

Não armazenar CPF no Supabase.

### Motivo

* reduzir responsabilidade LGPD
* simplificar backend
* deixar Asaas como fonte oficial

---

## Cancelamento

### Decisão

Cancelar dentro do próprio app.

### Motivo

* transparência
* confiança
* redução de suporte
* evitar problemas jurídicos

---

# Pendências Principais

## Prioridade Alta

### Refinamento visual

Pendências:

* reduzir excesso de branco
* melhorar contraste
* melhorar hierarquia visual
* padronizar cards
* melhorar responsividade fina

---

### Melhorias no OCR

Possíveis melhorias:

* highlighting de confiança
* preview visual
* comparação imagem/texto

---

### Correção inline no texto

Objetivo:

* destacar trechos diretamente no texto
* UX estilo Grammarly

---

## Prioridade Média

### Analytics

Implementar:

* conversão free → pro
* número de redações
* retenção
* churn

---

### Monitoramento

Implementar:

* logs estruturados
* alertas webhook
* monitoramento OpenAI
* monitoramento OCR

---

### Produção Asaas

Pendências:

* migrar sandbox → produção
* API key produção
* webhook produção
* ambiente separado

---

# Regras de Negócio Oficiais

## Créditos

| Plano      | Créditos |
| ---------- | -------- |
| Free       | 3 totais |
| Pro Mensal | 20/mês   |
| Pro Anual  | 20/mês   |

---

## Correção

* cada redação consome 1 crédito
* OCR não consome crédito

---

## Cancelamento

* usuário pode cancelar a qualquer momento
* cancelamento impede novas cobranças
* histórico permanece intacto

---

# Fluxos Críticos

## Fluxo principal

```txt
Cadastro
→ Escolha de tema
→ OCR opcional
→ Revisão do texto
→ Correção IA
→ Resultado
→ Histórico
→ Evolução
→ Upgrade Pro
```

---

## Fluxo de pagamento

```txt
/planos
→ modal CPF
→ checkout Asaas
→ PAYMENT_CONFIRMED
→ webhook
→ profiles.plan = pro
→ set_credit_balance(20)
```

---

## Fluxo de cancelamento

```txt
/perfil
→ cancelar plano
→ DELETE Asaas subscription
→ subscriptions.cancelled
→ profiles.plan = free
```

---

# Estado Atual do Produto

## Situação real

O produto já possui:

* autenticação
* IA funcional
* OCR funcional
* dashboard
* histórico
* evolução
* pagamentos
* webhooks
* cancelamento
* créditos
* deploy online

---

## Conclusão

O Reda1000 já se encontra em estágio:

```txt
MVP funcional avançado
```

As próximas etapas concentram-se principalmente em:

* refinamento visual
* UX avançada
* estabilidade
* métricas
* primeiros usuários reais
* lançamento público
