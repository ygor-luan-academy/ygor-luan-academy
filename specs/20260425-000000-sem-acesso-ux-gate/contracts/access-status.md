# Contract: GET /api/auth/access-status

## Endpoint

```
GET /api/auth/access-status
```

## Authentication

Required. Cookie session (`sb-*` cookies via `@supabase/ssr`).  
Middleware popula `locals.user`. Endpoint retorna 401 se `!locals.user`.

## Request

Sem body. Sem query params.

## Responses

### 401 — Não autenticado

```json
{ "error": "Não autenticado" }
```

### 200 — OK

```ts
{
  hasAccess: boolean;       // true se lastOrder?.status === 'approved'
  lastOrder: {
    status: 'pending' | 'approved' | 'failed' | 'refunded';
    created_at: string;     // ISO 8601
  } | null;                 // null se user não tem nenhum pedido
}
```

**Exemplos:**

User sem pedido:
```json
{ "hasAccess": false, "lastOrder": null }
```

User com pedido pendente:
```json
{ "hasAccess": false, "lastOrder": { "status": "pending", "created_at": "2026-04-25T10:00:00.000Z" } }
```

User com acesso aprovado:
```json
{ "hasAccess": true, "lastOrder": { "status": "approved", "created_at": "2026-04-25T10:01:00.000Z" } }
```

## Headers (response)

```
Cache-Control: private, no-store, max-age=0   ← aplicado pelo middleware
Vary: Cookie                                   ← aplicado pelo middleware
Content-Type: application/json
```

## Consumers

- `src/islands/AccessStatusWatcher.tsx` — polling a cada 5s
- Botão "Verificar agora" na island (fetch imediato)
