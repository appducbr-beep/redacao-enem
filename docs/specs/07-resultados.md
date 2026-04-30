# Spec 07 — Resultados da Correção

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir como os resultados da correção são exibidos ao usuário.

## Tela de resultados (`/redacoes/<id>`)

### Estados da tela

| Status da redação | O que o usuário vê                              |
|-------------------|------------------------------------------------|
| `pending`         | Spinner "Aguardando correção..."               |
| `processing`      | Spinner "Corrigindo com IA..."                 |
| `done`            | Resultado completo                             |
| `error`           | Mensagem de erro + botão para reenviar         |

### Conteúdo quando `done`

1. **Nota total** — destaque visual (ex: 720/1000)
2. **Gráfico de competências** — radar/spider chart com C1–C5
3. **Notas por competência** — cards individuais com nota + feedback textual
4. **Comentário geral** — parágrafo com avaliação global
5. **Pontos positivos** — lista
6. **Pontos de melhoria** — lista
7. **Texto original** — exibido com possibilidade de expansão

### Ações disponíveis

- Compartilhar resultado (link público opcional)
- Baixar PDF do resultado
- Escrever nova redação no mesmo tema
- Ver histórico completo

## Atualização em tempo real

- Polling a cada 3 segundos enquanto `status = 'processing'`
- Ou Supabase Realtime subscription na tabela `redacoes`

## Escopo desta spec

Exibição de resultados. Histórico é coberto na spec 08.

## Fora de escopo

- Comparação de redações lado a lado — versão futura
- Recomendações personalizadas de estudo — versão futura
