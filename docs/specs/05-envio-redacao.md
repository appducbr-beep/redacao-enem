# Spec 05 — Envio de Redação

**Status:** rascunho  
**Versão:** 0.1  
**Última atualização:** 2026-04-25

---

## Objetivo

Definir como o usuário submete uma redação para correção.

## Modalidades de envio previstas

| Modalidade  | Descrição                                          | Prioridade |
|-------------|---------------------------------------------------|------------|
| Digitação   | Usuário digita diretamente no editor da plataforma | P0         |
| Upload PDF  | Usuário faz upload de PDF da redação              | P1         |
| Foto        | Usuário faz upload de foto da folha manuscrita    | P2 (futura)|

## Fluxo principal (digitação)

1. Usuário seleciona um tema e acessa `/redacoes/nova`
2. Editor de texto exibe o tema e textos motivadores
3. Usuário digita a redação (mínimo 7 linhas, máximo ~1000 palavras)
4. Validação client-side: contagem de palavras, alerta se fora do intervalo
5. Usuário clica em "Enviar para correção"
6. Sistema verifica se usuário tem créditos ou plano ativo
7. Redação é salva em `redacoes` com `status = 'pending'`
8. Job de correção é enfileirado (chamada à API de IA)
9. Usuário é redirecionado para `/redacoes/<id>` com status "Processando..."

## Validações

- Texto não pode estar vazio
- Mínimo de 100 palavras (aviso, não bloqueio)
- Máximo de 1000 palavras (bloqueio)
- Tema deve estar ativo
- Usuário deve estar autenticado
- Usuário deve ter crédito ou assinatura ativa

## Consumo de crédito

- 1 correção = 1 crédito
- Crédito é consumido no momento do envio
- Se a correção falhar, o crédito é estornado automaticamente

## Escopo desta spec

Envio de redação por digitação. Upload de arquivo será detalhado em spec futura.

## Fora de escopo

- OCR de imagem manuscrita — versão futura
- Rascunhos salvos automaticamente — versão futura
