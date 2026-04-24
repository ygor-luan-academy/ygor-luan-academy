import type { APIRoute } from 'astro';
import { logger } from '../../lib/logger';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    logger.error('csp.violation', body);
  } catch {
    // malformed body — ignore
  }
  return new Response(null, { status: 204 });
};
