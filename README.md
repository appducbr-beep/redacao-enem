# Reda1000

Plataforma web para correção de redações no estilo ENEM com inteligência artificial.

## Visão geral

O Reda1000 permite que estudantes enviem redações e recebam correções detalhadas baseadas nos cinco critérios da banca ENEM, com feedback gerado por LLMs via Groq.

## Stack

| Camada         | Tecnologia                   |
|----------------|------------------------------|
| Frontend       | Next.js 16 + TypeScript      |
| Backend/API    | Next.js API Routes           |
| Banco de dados | Supabase (PostgreSQL)        |
| Autenticação   | Supabase Auth                |
| LLM Hub        | Groq                         |
| Pagamentos     | Asaas                        |
| Hospedagem     | Vercel                       |
| Versionamento  | GitHub                       |

## Estrutura do monorepo

```
reda1000/
├── apps/
│   ├── web/            # Aplicação Next.js (frontend + API routes)
│   │   ├── app/        # App Router (páginas e layouts)
│   │   ├── components/ # Componentes React reutilizáveis
│   │   ├── lib/        # Utilitários e clientes de serviços
│   │   └── types/      # Tipos TypeScript globais
│   └── api/            # Serviços de backend isolados (futuro)
├── docs/
│   ├── specs/          # Especificações de produto e técnicas
│   ├── tasks/          # Registro de tasks executadas
│   └── prompts/        # Prompts de IA versionados
├── packages/           # Pacotes compartilhados (futuro)
├── .env.example        # Variáveis de ambiente necessárias
└── .gitignore
```

## Como rodar o frontend

```bash
# 1. Entre no diretório da aplicação web
cd apps/web

# 2. Copie o arquivo de variáveis de ambiente
cp ../../.env.example .env.local
# Preencha as variáveis em .env.local

# 3. Instale as dependências (já instaladas se você usou create-next-app)
npm install

# 4. Suba o servidor de desenvolvimento
npm run dev
```

O app estará disponível em [http://localhost:3000](http://localhost:3000).

## Scripts disponíveis (apps/web)

| Comando         | Descrição                          |
|-----------------|-----------------------------------|
| `npm run dev`   | Servidor de desenvolvimento       |
| `npm run build` | Build de produção                 |
| `npm run start` | Servidor de produção (após build) |
| `npm run lint`  | Verificação de lint (ESLint)      |

## Primeiros passos para novos devs

1. Clone o repositório
2. Siga as instruções de "Como rodar o frontend" acima
3. Leia [docs/specs/00-visao-produto.md](docs/specs/00-visao-produto.md) para entender o produto
4. Leia [docs/specs/01-arquitetura.md](docs/specs/01-arquitetura.md) para entender a arquitetura
5. Consulte [docs/tasks/](docs/tasks/) para ver o histórico de execução

## Supabase setup

Consulte o guia completo em [docs/tasks/task-005-supabase-setup.md](docs/tasks/task-005-supabase-setup.md).

Resumo dos passos:

```bash
# 1. Configure as variáveis de ambiente
cp apps/web/.env.example apps/web/.env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Autentique na CLI
npx supabase login

# 3. Vincule ao projeto remoto (project-ref está na URL do Dashboard)
npx supabase link --project-ref <project-ref>

# 4. Confirme as migrations sem aplicar
npx supabase db push --dry-run

# 5. Aplique as migrations após revisar o dry-run
npx supabase db push
```

> ⚠️ A `service_role` key bypassa o RLS e **nunca deve ser usada no frontend**.
> Só utilize a chave `anon public` em variáveis `NEXT_PUBLIC_`.

## Metodologia

Este projeto segue metodologia **spec-driven**: toda funcionalidade deve ter uma spec em `docs/specs/` aprovada antes da implementação.

## Status

`frontend base criado — banco modelado — migrations prontas para execução`
