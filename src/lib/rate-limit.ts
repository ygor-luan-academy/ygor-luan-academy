type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const xRealIp = headers.get('x-real-ip')?.trim();
  if (xRealIp) {
    return xRealIp;
  }

  return 'unknown';
}

export function consumeRateLimit({
  bucket,
  identifier,
  limit,
  windowMs,
  now = Date.now(),
}: {
  bucket: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitDecision {
  const key = `${bucket}:${identifier}`;
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: existing.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
