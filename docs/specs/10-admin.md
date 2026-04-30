# Spec 10 — Painel Administrativo

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir o painel de administração para gestão da plataforma.

## Acesso

- Rota: `/admin`
- Requer role `admin` no perfil do usuário (campo `role` em `profiles`)
- Middleware bloqueia acesso de usuários sem role admin

## Módulos do painel

### Usuários (`/admin/usuarios`)
- Listagem de todos os usuários
- Busca por e-mail ou nome
- Ver detalhes: plano, créditos, total de redações
- Ações: adicionar créditos manualmente, banir usuário

### Temas (`/admin/temas`)
- Listar, criar, editar e desativar temas
- Pré-visualização do tema como o aluno vê
- Upload de textos motivadores

### Redações (`/admin/redacoes`)
- Listagem de todas as redações
- Filtros: status, data, usuário, tema
- Ver redação + resultado da correção
- Reprocessar correções com erro

### Pagamentos (`/admin/pagamentos`)
- Listagem de transações
- Status de pagamentos
- Logs de webhooks Asaas recebidos

### Dashboard admin (`/admin`)
- KPIs: total usuários, redações hoje, receita do mês
- Gráfico de redações por dia
- Taxa de erros de correção

## Proteção

- Todas as rotas `/admin/**` protegidas por middleware
- API Routes admin verificam role via JWT + banco
- Logs de ações administrativas (audit log) — versão futura

## Escopo desta spec

Painel administrativo inicial. Funcionalidades avançadas como relatórios e exportações são versão futura.

## Fora de escopo

- Painel para professores — versão futura
- Gestão de turmas/escolas — versão futura
