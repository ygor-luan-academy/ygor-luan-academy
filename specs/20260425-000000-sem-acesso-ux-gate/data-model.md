# Data Model: UX Gate /sem-acesso

## Entidades Envolvidas

### `Order` (existente)

```ts
// src/types/index.ts
interface Order {
  id: string;
  user_id: string;
  payment_id: string;
  status: 'pending' | 'approved' | 'failed' | 'refunded';
  amount: number;
  payment_method: string;
  created_at: string;      // ISO 8601
  approved_at: string | null;
}
```

Fonte: tabela `orders` no Supabase. Query via `supabaseAdmin` (service role, server-side only).

### `StatusContext` (novo)

```ts
// src/lib/order-status-message.ts
interface StatusContext {
  title: string;
  body: string;
  showBuyButton: boolean;
  showSupportLink: boolean;
  pollingRelevant: boolean;
}
```

Não persiste em banco. Computed em runtime a partir do último `Order`.

## Mapeamento Order.status → StatusContext

| Condição | title | body | showBuyButton | showSupportLink | pollingRelevant |
|----------|-------|------|---------------|----------------|-----------------|
| `lastOrder = null` | "Acesso não encontrado" | "Você ainda não adquiriu o curso." | true | false | false |
| `status = 'pending'`, idade < 30min | "Pagamento em processamento" | "A confirmação chega em instantes." | false | false | true |
| `status = 'pending'`, idade ≥ 30min | "Pagamento em processamento" | "Está demorando mais que o esperado. Entre em contato com o suporte." | false | true | true |
| `status = 'failed'` | "Pagamento não confirmado" | "Houve um problema com seu pagamento. Tente novamente." | true | false | false |
| `status = 'refunded'` | "Pedido reembolsado" | "Seu acesso foi encerrado. Você pode adquirir novamente." | true | false | false |
| `status = 'approved'` | — | — | — | — | — (não chega aqui: middleware redireciona) |

## Novo Método de Serviço

```ts
// src/services/orders.service.ts
static async getLatestByUserId(userId: string): Promise<Order | null>
```

Query:
```sql
SELECT * FROM orders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1
```

Implementação via Supabase client:
```ts
.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
```

Error handling: try/catch + `logger.error` + return `null` (fail-closed, não expõe detalhes ao usuário).

## Fluxo de Dados

```
Browser → GET /api/auth/access-status
                ↓
        locals.user (middleware)
                ↓
        OrdersService.getLatestByUserId(userId)
                ↓
        lastOrder: Order | null
                ↓
        hasAccess = lastOrder?.status === 'approved'
                ↓
        { hasAccess, lastOrder: { status, created_at } | null }
                ↓
AccessStatusWatcher
  hasAccess=true → redirect /dashboard
  hasAccess=false → aguarda próximo tick
```
