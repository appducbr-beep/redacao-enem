# Spec 08 — Histórico de Redações

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir como o usuário acessa e navega pelo histórico de suas redações corrigidas.

## Tela de histórico (`/historico`)

### Lista de redações

- Exibida em ordem cronológica decrescente
- Paginação (10 itens por página) ou scroll infinito
- Cada item exibe:
  - Tema da redação
  - Data de envio
  - Nota total
  - Status (done / error)
  - Botão "Ver resultado"

### Filtros

- Por tema
- Por intervalo de datas
- Por faixa de nota (ex: abaixo de 500, 500–700, acima de 700)

## Gráfico de evolução

- Linha do tempo da nota total ao longo das redações
- Exibido no topo da tela de histórico
- Objetivo: mostrar a curva de aprendizado do aluno

## Dashboard (`/dashboard`)

- Resumo rápido: total de redações, média geral, última nota
- Atalho para "Escrever nova redação"
- Últimas 3 redações

## Escopo desta spec

Histórico e dashboard do aluno. Painel administrativo é coberto na spec 10.

## Fora de escopo

- Exportação completa do histórico em CSV — versão futura
- Compartilhamento de evolução com professor — versão futura
