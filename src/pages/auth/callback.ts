import type { APIRoute } from 'astro';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export const GET: APIRoute = async ({ url, request, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) return redirect('/login');

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(request.headers.get('Cookie') ?? ''),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          for (const { name, value, options } of cookiesToSet) {
            cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return redirect('/login');

  return redirect(next);
};
