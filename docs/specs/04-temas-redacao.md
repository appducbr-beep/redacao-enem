# Spec 04 — Temas de Redação

**Status:** revisado  
**Versão:** 0.2  
**Última atualização:** 2026-04-26  
**Histórico:**
- v0.1 — rascunho inicial
- v0.2 — (task-009) adicionados campos `is_free` e `description`; corrigidos nomes do JSONB para inglês; documentadas regras Free/Pro; atualizada estrutura de rota

---

## Objetivo

Definir como os temas de redação são cadastrados, exibidos e selecionados pelo usuário, incluindo as regras de acesso por plano.

---

## Modelo de dados — `essay_topics`

| Coluna               | Tipo        | Restrições                     | Descrição                                                    |
|----------------------|-------------|--------------------------------|--------------------------------------------------------------|
| id                   | uuid        | PK, DEFAULT gen_random_uuid()  |                                                              |
| title                | text        | NOT NULL                       | Enunciado do tema                                            |
| year                 | integer     | nullable, CHECK 1998–2100      | Ano ENEM de referência. NULL = tema novo (não histórico)     |
| description          | text        | nullable                       | Descrição curta (1-2 frases) exibida no card de listagem     |
| is_free              | boolean     | NOT NULL, DEFAULT true         | true = acessível no plano Free; false = exige Pro ou School  |
| motivational_texts   | jsonb       | NOT NULL, DEFAULT '[]'         | Array de textos motivadores (ver estrutura abaixo)           |
| active               | boolean     | NOT NULL, DEFAULT true         | Temas inativos não aparecem na listagem                      |
| created_at           | timestamptz | NOT NULL, DEFAULT now()        |                                                              |
| updated_at           | timestamptz | NOT NULL, DEFAULT now()        | Atualizado via trigger                                       |

### Estrutura de `motivational_texts` (JSONB)

Os nomes dos campos seguem o padrão **inglês** da migration:

```json
[
  {
    "type": "text",
    "source": "Adaptado de: Folha de S.Paulo, 2023",
    "content": "Texto completo do motivador..."
  },
  {
    "type": "image",
    "source": "IBGE, 2022",
    "url": "https://..."
  },
  {
    "type": "chart",
    "source": "Instituto X, 2024",
    "url": "https://..."
  }
]
```

Valores aceitos para `type`: `"text"` | `"image"` | `"chart"`

> **Atenção:** A spec v0.1 usava nomes em português (`tipo`, `fonte`, `conteudo`). O banco sempre usou inglês. A v0.2 corrige a inconsistência.

---

## Regras de acesso por plano

| Situação                               | Comportamento                                          |
|----------------------------------------|--------------------------------------------------------|
| `is_free = true`, qualquer plano        | Tema acessível — botão "Ver tema"                     |
| `is_free = false`, `plan = 'pro'`       | Tema acessível — botão "Ver tema"                     |
| `is_free = false`, `plan = 'school'`    | Tema acessível — botão "Ver tema"                     |
| `is_free = false`, `plan = 'free'`      | Tema bloqueado — visual cinza + botão "Ver planos"    |
| Usuário não autenticado                 | Redirect para `/login`                               |

### Implementação de acesso

- **RLS não distingue** Free/Pro — todo autenticado vê todos os temas ativos. Isso é **intencional**: temas Pro devem aparecer visíveis mas bloqueados (não ocultos) para usuários Free.
- A filtragem é feita na aplicação:
  - `profiles.plan` é lido no Server Component
  - `is_free || isPro` determina se o usuário pode abrir o tema
- Em `/temas/[id]`: se `!accessible`, a página mostra um estado de bloqueio, não um 404

---

## Fluxos

### Listagem de temas (`/temas`)

1. Usuário autenticado acessa `/temas`
2. Sistema busca `profiles.plan` do usuário
3. Sistema lista todos os `essay_topics` com `active = true`, ordenados por `year DESC NULLS LAST`
4. Cada card exibe: título, ano, badge Gratuito/Pro, descrição curta
5. Temas Pro para usuários Free mostram visual bloqueado + "Ver planos"

### Detalhe do tema (`/temas/[id]`)

1. Usuário clica em "Ver tema"
2. Sistema busca o tema e o plano do usuário
3. Se não acessível: mostra tela de bloqueio com CTA Pro
4. Se acessível: exibe título, descrição, textos motivadores
5. Botão "Começar redação" (desabilitado até Task 010)

### Seleção → Redação

1. Usuário clica "Começar redação" → vai para `/redacoes/nova?tema=<id>` (Task 010+)

---

## Cadastro de temas (admin)

- Via painel `/admin/temas` (Task 012+)
- Suporte a temas históricos ENEM e temas novos
- Campo `is_free` definido pelo admin no cadastro
- Temas podem ser desativados sem exclusão (`active = false`)

---

## Fora de escopo desta spec

- Geração automática de temas com IA
- Filtro por ano/busca por palavra-chave (previsto, não implementado)
- Painel admin de gerenciamento de temas
