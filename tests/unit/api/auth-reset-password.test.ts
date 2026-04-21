import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/auth.service', () => ({
  AuthService: {
    resetPassword: vi.fn(),
  },
}));

import { POST } from '../../../src/pages/api/auth/reset-password';
import { resetRateLimitStore } from '../../../src/lib/rate-limit';
import { AuthService } from '../../../src/services/auth.service';

function makeContext(body?: unknown, ip = '203.0.113.20') {
  return {
    request: new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  } as never;
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  it('retorna 400 quando body não é JSON válido', async () => {
    const response = await POST({
      request: new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
    } as never);

    expect(response.status).toBe(400);
  });

  it('retorna 400 quando e-mail está ausente', async () => {
    const response = await POST(makeContext({}));

    expect(response.status).toBe(400);
  });

  it('retorna 200 e chama o serviço com e-mail normalizado', async () => {
    const response = await POST(makeContext({ email: '  aluno@exemplo.com ' }));

    expect(response.status).toBe(200);
    expect(AuthService.resetPassword).toHaveBeenCalledWith('aluno@exemplo.com');
  });

  it('retorna 200 mesmo quando o serviço falha', async () => {
    vi.mocked(AuthService.resetPassword).mockRejectedValueOnce(new Error('User not found'));

    const response = await POST(makeContext({ email: 'aluno@exemplo.com' }));

    expect(response.status).toBe(200);
  });

  it('retorna 429 após muitas solicitações do mesmo IP', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await POST(makeContext({ email: 'aluno@exemplo.com' }));
      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(makeContext({ email: 'aluno@exemplo.com' }));

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get('retry-after')).toBeTruthy();
    expect(AuthService.resetPassword).toHaveBeenCalledTimes(3);
  });
});
