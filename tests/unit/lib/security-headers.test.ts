import { describe, expect, it } from 'vitest';

import { applySecurityHeaders, getSecurityHeaders } from '../../../src/lib/security-headers';

describe('security headers', () => {
  it('retorna headers básicos para requisições http', () => {
    const headers = getSecurityHeaders(new URL('http://localhost/login'));

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
  });

  it('inclui HSTS em requisições https', () => {
    const headers = getSecurityHeaders(new URL('https://ygorluanacademy.com.br/login'));

    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
  });

  it('inclui Content-Security-Policy-Report-Only com diretivas corretas', () => {
    const headers = getSecurityHeaders(new URL('https://ygorluanpro.com.br/'));

    const csp = headers['Content-Security-Policy-Report-Only'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://player.vimeo.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('report-uri /api/csp-report');
  });

  it('preserva headers existentes ao aplicar headers de segurança', async () => {
    const original = new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });

    const secured = applySecurityHeaders(original, new URL('https://ygorluanacademy.com.br/api/test'));

    expect(secured.status).toBe(201);
    expect(secured.headers.get('Content-Type')).toBe('application/json');
    expect(secured.headers.get('Cache-Control')).toBe('no-store');
    expect(secured.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
