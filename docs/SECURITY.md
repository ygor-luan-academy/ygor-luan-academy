# Seguranca

## Checklist
- [ ] HTTPS obrigatorio (Vercel default)
- [ ] RLS habilitado em todas as tabelas
- [ ] Validacao de entrada (frontend + backend)
- [ ] Rate limiting (Supabase built-in)
- [ ] CSP headers configurados
- [ ] Secrets no .env (nunca commitar)
- [ ] Sanitizacao de dados do usuario
- [ ] CORS configurado corretamente

## Regras
- `SUPABASE_SERVICE_ROLE_KEY` nunca exposta no frontend
- `supabaseAdmin` usado apenas em webhooks/server-only contexts
- HMAC validado com `timingSafeEqual` (Node crypto) nos webhooks
- Middleware centraliza auth + autorizacao para rotas protegidas
