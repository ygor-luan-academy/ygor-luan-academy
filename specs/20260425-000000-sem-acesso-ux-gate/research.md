# Research: UX Gate /sem-acesso

## Decisão 1: Polling vs. Realtime

**Decisão**: Polling periódico (`setInterval`) via endpoint REST  
**Rationale**: Cakto webhook típico resolve em 5-60s. Polling de 5s com timeout de 5min é UX aceitável. Supabase Realtime requer configuração de canais autenticados em islands React com `@supabase/supabase-js` client-side, expõe anon key (aceitável mas complexidade desnecessária), e requer handling de reconnect. Nenhum benefício real de latência para o caso de uso.  
**Alternativas consideradas**: Supabase Realtime (rejeitado), Server-Sent Events (rejeitado — Vercel Edge suporta mas adiciona infra sem ganho)

## Decisão 2: Onde computar `hasAccess` no endpoint

**Decisão**: `hasAccess = lastOrder?.status === 'approved'`  
**Rationale**: Uma query retorna o último pedido. `hasAccess` deriva diretamente de `status`. Evita segunda query a `OrdersService.hasActiveAccess`. Consistente com o modelo de dados atual.  
**Alternativas consideradas**: Chamar `hasActiveAccess` separadamente (rejeitado — query adicional sem ganho)

## Decisão 3: Timeout do polling

**Decisão**: 60 ticks × 5s = 5 minutos  
**Rationale**: Se após 5min o webhook não chegou, algo está errado e o usuário deve contatar suporte. O botão manual continua disponível após timeout.  
**Alternativas consideradas**: Sem timeout (rejeitado — polling infinito é resource leak), 2min (rejeitado — muito curto para webhooks lentos)

## Decisão 4: Separar `getStatusContext` em pure function

**Decisão**: `src/lib/order-status-message.ts` — função pura sem dependências  
**Rationale**: Testável isoladamente sem mocks. Usada tanto no server-side render (`.astro`) quanto potencialmente na island. Segue princípio de separar lógica de apresentação da lógica de negócio.  
**Alternativas consideradas**: Inline na página `.astro` (rejeitado — não testável), no serviço (rejeitado — lógica de UI não pertence ao serviço)

## Descobertas do codebase

- `OrdersService.hasActiveAccess` usa `.maybeSingle()` — mesmo padrão para `getLatestByUserId`
- `locals.user` já populado pelo middleware para qualquer rota protegida — endpoint pode confiar nele sem re-autenticar
- `src/lib/logger.ts` disponível para error handling no novo método de serviço
- Tests de islands existentes em `tests/unit/islands/` usam `@testing-library/react` + vitest — mesmo padrão para `AccessStatusWatcher`
- Endpoint `/api/auth/signout.ts` como referência de padrão para novos endpoints auth
