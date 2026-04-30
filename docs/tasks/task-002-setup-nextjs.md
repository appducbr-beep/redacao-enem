# Task 002 — Setup da Aplicação Next.js

**Status:** concluída  
**Data:** 2026-04-25  
**Responsável:** Claude Code (operador técnico)  
**Spec de referência:** [docs/specs/01-arquitetura.md](../specs/01-arquitetura.md)

---

## Objetivo

Criar a aplicação frontend Next.js em `apps/web` com configuração base profissional, sem implementar funcionalidades de produto.

## Comandos executados

```bash
# 1. Remoção do .gitkeep para liberar o diretório
rm apps/web/.gitkeep

# 2. Criação da aplicação Next.js
npx create-next-app@latest apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes

# 3. Remoção do repositório git aninhado gerado pelo create-next-app
rm -rf apps/web/.git

# 4. Criação das pastas base da aplicação
mkdir apps/web/components apps/web/lib apps/web/types
```

## Versões instaladas

| Pacote        | Versão   |
|---------------|----------|
| next          | 16.2.4   |
| react         | 19.2.4   |
| react-dom     | 19.2.4   |
| tailwindcss   | ^4       |
| typescript    | ^5       |
| eslint        | ^9       |

## Arquivos criados/alterados

| Arquivo                              | Ação     | Descrição                                   |
|--------------------------------------|----------|---------------------------------------------|
| `apps/web/app/page.tsx`              | alterado | Substituído pelo template Reda1000          |
| `apps/web/app/layout.tsx`            | alterado | Metadata atualizada para Reda1000           |
| `apps/web/app/globals.css`           | mantido  | Tailwind v4 + CSS variables do template     |
| `apps/web/components/`               | criado   | Pasta para componentes React reutilizáveis  |
| `apps/web/lib/`                      | criado   | Pasta para utilitários e clientes           |
| `apps/web/types/`                    | criado   | Pasta para tipos TypeScript globais         |
| `apps/web/package.json`              | criado   | Dependências da aplicação                   |
| `apps/web/tsconfig.json`             | criado   | Configuração TypeScript                     |
| `apps/web/next.config.ts`            | criado   | Configuração Next.js                        |
| `apps/web/eslint.config.mjs`         | criado   | Configuração ESLint                         |
| `apps/web/postcss.config.mjs`        | criado   | Configuração PostCSS para Tailwind v4       |
| `README.md`                          | alterado | Instruções de execução do frontend          |

## Ajustes manuais realizados

### 1. Remoção do git aninhado
O `create-next-app` inicializa um repositório git dentro de `apps/web`. Como o projeto é um monorepo com git na raiz, o repositório aninhado foi removido para evitar que `apps/web` seja tratado como git submodule.

### 2. Substituição do template padrão
O template padrão do Next.js foi substituído por uma página mínima do Reda1000 com:
- Título "Reda1000" com destaque em azul
- Subtítulo descritivo
- Indicação de "Projeto em construção"

### 3. Layout atualizado
- Removida fonte `Geist_Mono` (não necessária no momento)
- `lang` alterado de `"en"` para `"pt-BR"`
- Metadata com título e descrição do Reda1000

## Critérios de aceite

- [x] Next.js criado em `apps/web` com TypeScript
- [x] App Router configurado
- [x] Tailwind CSS configurado (v4)
- [x] ESLint configurado
- [x] Sem pasta `src/`
- [x] Pastas `components/`, `lib/`, `types/` criadas
- [x] Página inicial simples com título, subtítulo e status
- [x] `lang="pt-BR"` no layout
- [x] Metadata correta no layout
- [x] README.md atualizado com instruções de execução
- [x] Git aninhado removido
- [x] Nenhuma funcionalidade de produto implementada
- [x] Nenhuma integração com Supabase, Groq ou Asaas

## Como rodar

```bash
cd apps/web
npm run dev
# Acesse http://localhost:3000
```

## Próxima task sugerida

**Task 003 — Setup do Supabase**
- Criar projeto no Supabase
- Instalar `@supabase/ssr` e `@supabase/supabase-js` em `apps/web`
- Escrever migrations iniciais (tabelas de `profiles`, `redacoes`, `correcoes`, `temas`)
- Configurar RLS e políticas de segurança
- Configurar cliente Supabase em `apps/web/lib/supabase/`
