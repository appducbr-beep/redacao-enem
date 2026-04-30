# Spec 01 — Arquitetura

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir a arquitetura geral da plataforma, responsabilidades de cada camada e decisões técnicas fundamentais.

## Visão geral

```
[ Usuário / Browser ]
        |
[ Next.js (Vercel) ] ── Server Components + API Routes
        |
   ┌────┴────────────────────────┐
   |                             |
[ Supabase ]              [ Groq API ]
  - Auth                   - LLM Inference
  - PostgreSQL              - llama3-70b
  - Storage                 - Correção de redações
        |
  [ Asaas ]
  - Pagamentos
  - Webhooks
```

## Camadas

### Frontend (apps/web)
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Estado:** React Context + Server State (React Query)

### Backend (apps/web/app/api)
- API Routes do próprio Next.js para operações server-side
- Validação de entrada com Zod
- Autenticação via Supabase JWT

### Banco de dados
- Supabase (PostgreSQL gerenciado)
- Row Level Security (RLS) habilitado
- Migrations via Supabase CLI

### Armazenamento de arquivos
- Supabase Storage para imagens/PDFs de redações enviadas como foto

### Processamento de IA
- Groq como hub de LLM
- Modelo padrão: `llama3-70b-8192`
- Prompts versionados em `docs/prompts/`

### Pagamentos
- Asaas para gestão de cobranças e assinaturas
- Webhooks para atualização de status

## Decisões de arquitetura

| Decisão                          | Escolha              | Motivo                                              |
|----------------------------------|----------------------|-----------------------------------------------------|
| Monorepo vs. repos separados     | Monorepo             | Compartilhamento de tipos e simplicidade inicial    |
| ORM                              | Supabase client      | Integração nativa com RLS e Auth                    |
| Hosting                          | Vercel               | Integração nativa com Next.js                       |
| LLM                              | Groq                 | Latência baixa, modelos open-source, custo          |

## Escopo desta spec

Arquitetura de alto nível. Detalhes de cada módulo estão nas specs específicas.

## Fora de escopo

- Configuração de CI/CD — task futura
- Observabilidade e monitoramento — spec futura
