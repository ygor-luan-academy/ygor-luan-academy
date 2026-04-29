# Implementation Plan: UX Gate /sem-acesso

**Branch**: `20260425-000000-sem-acesso-ux-gate` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)

## Summary

Página `/sem-acesso` mostra mensagem genérica a usuários logados sem pedido ativo; sem polling, sem diferenciação de estado, sem email visível. Após pagamento Cakto (webhook 5-60s), usuário precisa de F5 manual. Esta feature adiciona: (1) render server-side contextual por status do último pedido; (2) endpoint `GET /api/auth/access-status`; (3) island `AccessStatusWatcher` com polling 5s + redirect automático ao receber `hasAccess: true`.

## Technical Context

**Language/Version**: TypeScript 5 / Node 20  
**Primary Dependencies**: Astro 5 (SSR), React 19, @supabase/ssr, Vitest 4, @testing-library/react  
**Storage**: Supabase PostgreSQL (tabela `orders`)  
**Testing**: Vitest 4 (unit + integration)  
**Target Platform**: Vercel Edge (SSR via `@astrojs/vercel`)  
**Project Type**: Web application (Astro Islands)  
**Performance Goals**: Polling 5s interval, timeout 5min; endpoint p95 <200ms  
**Constraints**: Sem Supabase Realtime; sem `any`; TDD obrigatório  
**Scale/Scope**: ~1k usuários; 1 order por user no happy path

## Constitution Check

| Princípio | Status | Notas |
|-----------|--------|-------|
| TDD First | ✅ | Todos os artefatos têm testes escritos antes do código |
| No `any` | ✅ | Tipos explícitos; `Order` já tipado em `src/types/` |
| Clean Code | ✅ | `getStatusContext` função pura isolada; island com SRP |
| SOLID | ✅ | `OrdersService` recebe novo método; sem quebra de SRP |
| KISS/YAGNI | ✅ | Polling simples vs. Realtime (Realtime = overengineering aqui) |
| Security | ✅ | Endpoint valida `locals.user`; `supabaseAdmin` server-only |
| No Comments | ✅ | Nomes descritivos o suficiente |

**GATE**: ✅ Sem violações.

## Project Structure

```text
specs/20260425-000000-sem-acesso-ux-gate/
├── spec.md
├── plan.md              ← este arquivo
├── research.md
├── data-model.md
└── contracts/
    └── access-status.md

src/
├── islands/
│   └── AccessStatusWatcher.tsx          [NEW]
├── lib/
│   └── order-status-message.ts          [NEW]
├── pages/
│   ├── sem-acesso.astro                 [MODIFY]
│   └── api/auth/
│       └── access-status.ts             [NEW]
└── services/
    └── orders.service.ts                [MODIFY — +getLatestByUserId]

tests/
├── unit/
│   ├── lib/
│   │   └── order-status-message.test.ts [NEW]
│   ├── islands/
│   │   └── AccessStatusWatcher.test.tsx [NEW]
│   └── services/
│       └── orders.service.test.ts       [MODIFY — +getLatestByUserId]
└── integration/
    └── api/
        └── access-status.test.ts        [NEW]
```

**Structure Decision**: Single project (Astro). Frontend (islands) + backend (API routes + services) coexistem em `src/`.

---

## Phase 0: Research

*Arquivo*: [research.md](./research.md)

### Decisões

| Decisão | Escolha | Alternativa Rejeitada | Razão |
|---------|---------|----------------------|-------|
| Push vs. Pull | Polling (GET `/api/auth/access-status`) | Supabase Realtime subscription | Realtime requer client-side key exposta, complexidade de auth em islands, e overkill p/ 5-60s latency do Cakto |
| Interval | 5s, max 60 ticks (5min) | 1s ou 10s | 5s = UX aceitável sem DDoS do endpoint; 5min = timeout após o qual usuário provavelmente saiu |
| Timeout behavior | Para polling, mantém botão manual ativo | Redirect p/ erro | Usuário não perde contexto |
| Endpoint path | `/api/auth/access-status` | `/api/me` ou `/api/orders/status` | Semântico: "posso acessar?"; reutilizável p/ futuro gate check |
| Status source | `OrdersService.getLatestByUserId` (1 query) | Re-checar `hasActiveAccess` + `getLatestByUserId` (2 queries) | O endpoint pode computar `hasAccess` do mesmo resultado: `status === 'approved'` |

---

## Phase 1: Design & Contracts

### Data Model

*Arquivo*: [data-model.md](./data-model.md)

#### Entidades envolvidas

**`Order`** (existente em `src/types/index.ts`):
```ts
{
  id: string;
  user_id: string;
  payment_id: string;
  status: 'pending' | 'approved' | 'failed' | 'refunded';
  amount: number;
  payment_method: string;
  created_at: string;
  approved_at: string | null;
}
```

**`StatusContext`** (novo, `src/lib/order-status-message.ts`):
```ts
interface StatusContext {
  title: string;
  body: string;
  showBuyButton: boolean;
  showSupportLink: boolean;
  pollingRelevant: boolean;
}
```

Mapeamento `Order.status → StatusContext`:

| `lastOrder` | `title` | `body` | `showBuyButton` | `pollingRelevant` |
|------------|---------|--------|-----------------|-------------------|
| `null` | "Acesso não encontrado" | "Você ainda não adquiriu o curso." | ✅ | ❌ |
| `pending` (< 30min) | "Pagamento em processamento" | "Confirmação chega em instantes." | ❌ | ✅ |
| `pending` (> 30min) | "Pagamento em processamento" | "Demora mais que o esperado — contate o suporte." | ❌ | ✅ |
| `failed` | "Pagamento não confirmado" | "Houve um problema. Tente novamente." | ✅ | ❌ |
| `refunded` | "Pedido reembolsado" | "Seu acesso foi encerrado." | ✅ | ❌ |
| `approved` | N/A | N/A — `hasAccess=true`, não chega aqui | — | — |

#### Novo método de serviço

```ts
// src/services/orders.service.ts
static async getLatestByUserId(userId: string): Promise<Order | null>
// SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
// .maybeSingle() — null se nenhum pedido
```

### API Contract

*Arquivo*: [contracts/access-status.md](./contracts/access-status.md)

```
GET /api/auth/access-status

Auth: Required (cookie session via middleware popula locals.user)

Response 401 — não autenticado:
  { "error": "Não autenticado" }

Response 200:
  {
    "hasAccess": boolean,          // true se status = 'approved'
    "lastOrder": {
      "status": "pending" | "approved" | "failed" | "refunded",
      "created_at": string          // ISO 8601
    } | null
  }

Cache-Control: private, no-store (aplicado pelo middleware via security-headers)
```

---

## Implementation Phases

### Fase 1 — `getStatusContext` + `getLatestByUserId` (TDD)

**Test Red** — `tests/unit/lib/order-status-message.test.ts`:
- `getStatusContext(null)` → `showBuyButton=true`, `pollingRelevant=false`
- `getStatusContext({status:'pending', created_at: now-5min})` → `pollingRelevant=true`, `showBuyButton=false`
- `getStatusContext({status:'pending', created_at: now-40min})` → body menciona "suporte"
- `getStatusContext({status:'failed'})` → `showBuyButton=true`, `pollingRelevant=false`
- `getStatusContext({status:'refunded'})` → `showBuyButton=true`, `pollingRelevant=false`

**Test Red** — `tests/unit/services/orders.service.test.ts` (describe `getLatestByUserId`):
- retorna pedido mais recente quando existe
- retorna `null` quando user não tem pedidos
- retorna `null` e loga quando Supabase retorna erro

**Green** — implementar `order-status-message.ts` + `OrdersService.getLatestByUserId`.

### Fase 2 — Endpoint `/api/auth/access-status` (TDD)

**Test Red** — `tests/integration/api/access-status.test.ts`:
- GET sem cookie → 401
- GET com cookie user sem pedido → `{ hasAccess: false, lastOrder: null }`
- GET com cookie user com `pending` → `{ hasAccess: false, lastOrder: { status: 'pending', ... } }`
- GET com cookie user com `approved` → `{ hasAccess: true, lastOrder: { status: 'approved', ... } }`

> Nota: testes integration usam mock de `supabaseAdmin` (mesmo padrão existente em `tests/integration/`). Não é instância real Supabase (conforme padrão existente no projeto).

**Green** — implementar `src/pages/api/auth/access-status.ts`:
```ts
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return json401;
  const lastOrder = await OrdersService.getLatestByUserId(locals.user.id);
  const hasAccess = lastOrder?.status === 'approved';
  return jsonOk({ hasAccess, lastOrder: lastOrder ? { status: lastOrder.status, created_at: lastOrder.created_at } : null });
};
```

### Fase 3 — Island `AccessStatusWatcher` (TDD)

**Test Red** — `tests/unit/islands/AccessStatusWatcher.test.tsx`:
- Renderiza sem polling quando `pollingRelevant=false` (estado `none`)
- Inicia polling quando `pollingRelevant=true`
- Chama `/api/auth/access-status` a cada 5s
- Redireciona `window.location.href = '/dashboard'` quando `hasAccess=true`
- Para polling após 60 ticks
- Botão "Verificar agora" dispara fetch imediato
- Mostra "Verificando..." durante fetch, "Verificado há Xs" entre ticks

**Green** — implementar `src/islands/AccessStatusWatcher.tsx`:
- Props: `pollingRelevant: boolean`
- `useEffect` com `setInterval(5000)`; cleanup no unmount
- `tickCount` ref p/ não afetar re-renders; para em 60
- `window.location.href = '/dashboard'` (fora de `useEffect` = fire-and-forget seguro)

### Fase 4 — `/sem-acesso.astro` server-side contextual

Server-side (frontmatter):
```ts
const lastOrder = user ? await OrdersService.getLatestByUserId(user.id) : null;
const ctx = getStatusContext(lastOrder);
```

Template:
- Exibir `{user?.email}` (com escape — Astro faz por default)
- `{ctx.title}` e `{ctx.body}`
- CTA compra condicional: `{ctx.showBuyButton && <a href="/#comprar">Adquirir o curso</a>}`
- Link suporte: `{ctx.showSupportLink && <a href="mailto:suporte@...">Contate o suporte</a>}`
- Montar `<AccessStatusWatcher client:load pollingRelevant={ctx.pollingRelevant} />`

---

## Verification

```bash
# 1. Type check
pnpm type-check     # zero erros

# 2. Tests (todos 506+ anteriores + 12+ novos = ~518 passing)
pnpm test:unit

# 3. Build
pnpm build

# 4. Smoke manual
pnpm dev
# — User logado sem order: /sem-acesso mostra email, "Acesso não encontrado", CTA compra, SEM polling
# — Inserir order status=pending no DB via Supabase → refresh → mostra "Pagamento em processamento", polling ativo (verificar console network tab a cada 5s)
# — Mudar status p/ approved → /sem-acesso redireciona p/ /dashboard em ≤5s
# — GET /api/auth/access-status sem cookie → 401
# — GET /api/auth/access-status com cookie → 200 + payload correto

# 5. Verificar Cache-Control do endpoint (já coberto pelo middleware)
curl -I http://localhost:4321/api/auth/access-status -b "<cookie>"
# → Cache-Control: private, no-store, max-age=0
```

---

## Complexity Tracking

> Sem violações a justificar. Polling simples é o caminho KISS aqui.
