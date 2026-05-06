# Segurança — Ygor Luan Academy

## Publicacao e Repositorio

Este repositorio e publico para referencia tecnica e transparencia, mas o codigo e proprietario.
Nao reutilize trechos sensiveis fora do contexto do projeto sem autorizacao por escrito.
Vulnerabilidades e falhas de seguranca devem ser reportadas em privado, sem abrir issue publica com detalhes de exploracao.

## Fluxo de Autenticação — Garantias e Limites

### Prefixos do middleware

| Rota | Comportamento |
|------|--------------|
| `PUBLIC_PREFIXES` (`/`, `/login`, `/redefinir-senha`, etc.) | Sem gate; usuário resolvido apenas em `AUTH_AWARE_PREFIXES` |
| `AUTH_AWARE_PREFIXES` (`/login`, `/redefinir-senha`) | Resolve user, sem gate — permite redirecionamento SSR de usuário já logado |
| `PROTECTED_PREFIXES` (`/dashboard`, `/admin`, `/api/progress`) | Gate completo: auth + acesso ativo + papel admin |

### Gates aplicados por rota protegida

1. `getUser()` — sessão via cookie Supabase SSR. Falha → redirect `/login` (páginas) ou 401 (API).
2. `OrdersService.hasActiveAccess(userId)` — `orders.status = 'approved'`. Falha → redirect `/sem-acesso`.
3. `UsersService.isAdmin(userId)` — `profiles.role = 'admin'`. Falha em `/admin` → redirect `/dashboard`.

### Validação de origem (CSRF)

- Todos os POSTs de auth (`/api/auth/login`, `/api/auth/signout`, `/api/auth/update-password`) verificam o header `Origin` contra `PUBLIC_SITE_URL`.
- Origem divergente → 403.
- Implementação: `src/lib/request-origin.ts` — `isSameOrigin(request)`.

### Rate limiting

- Implementado em `src/lib/rate-limit.ts`.
- Storage: Upstash Redis (via REST API) quando `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` configurados; fallback em Map em memória (dev local).
- Limites: login → 5 tentativas / 15 min por IP; reset-password → 3 / 15 min.
- Janela fixa com `INCR` + `EXPIRE NX`.

### Política de senha

- Implementada em `src/lib/password-policy.ts`.
- Regras: ≥ 8 chars, não está em top-50 senhas comuns, não contém prefixo do e-mail.
- Validação server-side no endpoint `/api/auth/update-password` (422 com `reasons[]`).

### Fluxo de reset de senha

- Endpoint server-side: `POST /api/auth/update-password`.
- Recovery fresh (sessão `last_sign_in_at < 10 min` + flag `isRecovery=true`): aceita sem senha atual.
- Caso contrário: exige `currentPassword` e revalida via `signInWithPassword`.
- Após sucesso: `signOut({scope: 'others'})` invalida sessões em outros devices.

### Webhook Cakto

- Validação por shared-secret no corpo do payload (`body.secret`), comparado com `timingSafeEqual` (Node crypto) para evitar timing attacks.
- Eventos tratados: `purchase_approved` (cria acesso) + `refund`/`chargeback`/`purchase_refunded` (revoga acesso via `orders.status = 'refunded'`).

### Content-Security-Policy

- Modo `Content-Security-Policy-Report-Only` — monitora violações sem bloquear.
- Violações reportadas para `POST /api/csp-report` → logger estruturado (`src/lib/logger.ts`).
- Após 7 dias sem violações legítimas, flipar para `Content-Security-Policy` (enforce).
- Implementação: `src/lib/security-headers.ts` — `CSP_REPORT_ONLY`.

### Logger estruturado

- `src/lib/logger.ts` — `logger.info/warn/error(event, context)`.
- Saída: JSON com `ts`, `level`, `event`, campos de contexto.
- Sem dependências externas; pode evoluir para Sentry/Axiom.

## Regras permanentes

- `SUPABASE_SERVICE_ROLE_KEY` nunca exposta no frontend.
- `supabaseAdmin` usado apenas em webhooks/server-only contexts.
- Shared-secret de webhook comparado com `timingSafeEqual` (Node crypto) para evitar timing attacks.
- Middleware centraliza auth + autorização para rotas protegidas.
- Nenhum segredo comitado — usar `.env.local` (ignorado pelo git).

## Fora de escopo (decisão consciente)

- MFA/2FA — exige fluxo de UX dedicado e backup codes; decisão de produto.
- JWT claim de role em `app_metadata` — depende de `custom_access_token_hook` no Supabase; adiado para quando o tráfego justificar (Onda 4.1).
- Cache de `hasActiveAccess` em cookie assinado — adiado; TTL curto com Redis existente é suficiente.
- Audit log persistente de login — Supabase logs + rate limit cobrem 80% do caso.
