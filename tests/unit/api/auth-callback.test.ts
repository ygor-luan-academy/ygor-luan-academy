import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExchangeCodeForSession = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
  parseCookieHeader: vi.fn(() => []),
}));

const { GET } = await import('../../../src/pages/auth/callback');

function makeCtx(searchParams: Record<string, string>) {
  const url = new URL(
    'http://localhost/auth/callback?' + new URLSearchParams(searchParams),
  );
  return {
    url,
    request: new Request(url.toString()),
    cookies: { set: vi.fn() },
    redirect: (path: string) =>
      new Response(null, { status: 302, headers: { Location: path } }),
  } as never;
}

describe('GET /auth/callback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redireciona para /login quando code está ausente', async () => {
    const res = await GET(makeCtx({}));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/login');
  });

  it('redireciona para next quando troca de code tem sucesso', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await GET(makeCtx({ code: 'abc123', next: '/redefinir-senha' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/redefinir-senha?recovery=1');
  });

  it('redireciona para /dashboard quando next está ausente e troca tem sucesso', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const res = await GET(makeCtx({ code: 'abc123' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/dashboard');
  });

  it('redireciona para /login quando troca de code falha', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: { message: 'code expired' },
    });
    const res = await GET(makeCtx({ code: 'badcode', next: '/redefinir-senha' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/login');
  });
});
