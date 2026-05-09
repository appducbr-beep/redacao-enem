# QA — Bugs e melhorias encontradas

**Branch:** v2-pre-lancamento  
**Data:** 2026-05-09

---

## Bugs corrigidos

### BUG-01 (crítico) — CTAs da tela de resultado causavam 404

**Arquivo:** `app/redacoes/[id]/page.tsx`

**Problema:** Os dois botões ao final de uma redação corrigida linkavam para `/redacao/nova` sem `tema_id`. A página `nova` chama `notFound()` quando `tema_id` está ausente, então ambos os cliques resultavam em 404.

**Correção:**
- "Escrever nova redação" → `/temas` (escolher qualquer tema)
- "Refazer esta redação" → `/redacao/nova?tema_id=<topicId>` (mesmo tema)
- Query atualizada para incluir `topic_id` no select
- O botão "Refazer" só é renderizado se `topicId` existir

---

### BUG-02 (UX) — Sem link de volta no histórico de redações

**Arquivo:** `app/redacoes/page.tsx`

**Problema:** Página `/redacoes` não tinha link de retorno para o início, deixando o usuário sem saída para navegação principal.

**Correção:** Adicionado "← Início" no topo, consistente com as demais páginas.

---

### BUG-03 (UX) — Estado `pending` sem informação ou ação

**Arquivo:** `app/redacoes/[id]/page.tsx`

**Problema:** Status `pending` mostrava apenas "Redação aguardando processamento..." sem nenhuma instrução ou saída navegável.

**Correção:** Novo layout com ícone amarelo, explicação clara ("ainda não foi enviada para correção — clique em Corrigir agora") e botão "Ir para o início".

---

### BUG-04 (UX) — Sem link de volta na página de planos

**Arquivo:** `app/planos/page.tsx`

**Problema:** Página `/planos` não tinha link de retorno, deixando o usuário sem navegação para o dashboard.

**Correção:** Adicionado "← Início" no topo acima do hero.

---

## Verificações OK

| Item | Status |
|---|---|
| Login — botão disabled durante submit | ✅ |
| Cadastro — botão disabled durante submit | ✅ |
| EssayForm — submit disabled + textarea disabled | ✅ |
| CorrectNowButton — disabled + loading text | ✅ |
| EssayHistoryList — empty state com CTA | ✅ |
| Dashboard — links visíveis para todas as seções | ✅ |
| Temas/[id] — link "← Temas" no topo | ✅ |
| Redacoes/[id] — link "← Início" no topo | ✅ |
| `npm run qa` (75 testes + lint + build) | ✅ |

---

## Pendências não cobertas pelo QA automatizado

- Teste com cartão sandbox Asaas (requer ngrok + webhook real)
- Teste de fluxo completo: cadastro → redação → correção → histórico
- Verificar responsividade mobile nas telas de resultado
