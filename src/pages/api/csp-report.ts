import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as unknown;
    console.error('[csp-report]', JSON.stringify(body));
  } catch {
    // malformed body — ignore
  }
  return new Response(null, { status: 204 });
};
