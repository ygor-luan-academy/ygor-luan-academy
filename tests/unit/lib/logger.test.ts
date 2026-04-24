import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../../src/lib/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.info chama console.log com campo event', () => {
    logger.info('auth.login', { userId: 'u1' });
    expect(console.log).toHaveBeenCalledOnce();
    const arg = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg) as Record<string, unknown>;
    expect(parsed.event).toBe('auth.login');
    expect(parsed.level).toBe('info');
    expect(parsed.userId).toBe('u1');
  });

  it('logger.warn chama console.warn com level warn', () => {
    logger.warn('rate.limit', { ip: '1.2.3.4' });
    expect(console.warn).toHaveBeenCalledOnce();
    const arg = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg) as Record<string, unknown>;
    expect(parsed.level).toBe('warn');
    expect(parsed.event).toBe('rate.limit');
  });

  it('logger.error chama console.error com level error', () => {
    logger.error('csp.violation', { blockedUri: 'https://evil.com' });
    expect(console.error).toHaveBeenCalledOnce();
    const arg = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg) as Record<string, unknown>;
    expect(parsed.level).toBe('error');
    expect(parsed.event).toBe('csp.violation');
  });

  it('inclui timestamp ISO em todos os logs', () => {
    logger.info('test.event', {});
    const arg = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const parsed = JSON.parse(arg) as Record<string, unknown>;
    expect(typeof parsed.ts).toBe('string');
    expect(new Date(parsed.ts as string).getTime()).toBeGreaterThan(0);
  });
});
