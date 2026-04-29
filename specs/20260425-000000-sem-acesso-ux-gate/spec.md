# Feature Spec: UX Gate /sem-acesso — Status Contextual + Polling Pós-Pagamento

**Branch**: `20260425-000000-sem-acesso-ux-gate`
**Date**: 2026-04-25
**Author**: Leonardo Brizolla

## Goal

Melhorar a experiência do usuário logado sem pedido ativo na página `/sem-acesso`. Atualmente, após o pagamento no Cakto, o webhook leva 5-60s para aprovar o pedido. O usuário fica preso vendo uma mensagem genérica e precisa dar F5 manual para acessar o dashboard. Além disso, a página não diferencia estados (nenhum pedido vs. pagamento pendente vs. pagamento falho).

## User Stories

1. **Como aluno que acabou de pagar**, quero que a página detecte automaticamente quando meu acesso for liberado e me redirecione para o dashboard, sem precisar dar F5.
2. **Como aluno com pagamento em processamento**, quero ver uma mensagem clara de que meu pedido está sendo processado, para não achar que houve erro.
3. **Como aluno com pagamento falho ou reembolsado**, quero ver uma mensagem específica sobre meu status, com orientação correta (tentar novamente vs. adquirir novo acesso).
4. **Como aluno**, quero ver qual e-mail está logado, para confirmar que estou na conta certa.

## Acceptance Criteria

- [ ] Página `/sem-acesso` exibe o e-mail do usuário logado.
- [ ] Página diferencia 4 estados: `none` (sem pedido), `pending` (processando), `failed` (falhou), `refunded` (reembolsado).
- [ ] Mensagem e CTA são contextualmente corretos para cada estado.
- [ ] Island `AccessStatusWatcher` faz polling em `/api/auth/access-status` a cada 5s.
- [ ] Polling para automaticamente após 60 ticks (5 min) ou ao receber `hasAccess: true`.
- [ ] Quando `hasAccess: true`, island redireciona para `/dashboard` automaticamente.
- [ ] Botão "Verificar agora" dispara fetch imediato e reseta o timer.
- [ ] Endpoint `/api/auth/access-status` retorna `401` sem autenticação.
- [ ] Endpoint `/api/auth/access-status` retorna `{ hasAccess, lastOrder }` para usuário autenticado.
- [ ] `pnpm type-check` zero erros.
- [ ] `pnpm test:unit` todos passando (+12 novos testes TDD).

## Scope

### In Scope
- `src/pages/sem-acesso.astro` — server-side render contextual
- `src/pages/api/auth/access-status.ts` — endpoint GET
- `src/islands/AccessStatusWatcher.tsx` — island com polling
- `src/lib/order-status-message.ts` — pure function de estado
- `src/services/orders.service.ts` — novo método `getLatestByUserId`
- Testes TDD p/ cada artefato novo

### Out of Scope
- Supabase Realtime subscription
- Email de notificação "acesso liberado"
- Histórico de pedidos na página

## Test Strategy
- Unit: `order-status-message`, `AccessStatusWatcher` (vitest + testing-library), `OrdersService.getLatestByUserId`
- Integration: `/api/auth/access-status` (401, 200, payload)
- E2E: fora do escopo desta feature
