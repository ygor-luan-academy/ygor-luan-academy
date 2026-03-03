import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../types/database.types';

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const ADMIN_PREFIXES = ['/admin'];

export const onRequest = defineMiddleware(async (
  { url, request, cookies, locals, redirect },
  next,
) => {
  const supabase = createServerClient<Database>(
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

  const { data: { session } } = await supabase.auth.getSession();
  locals.session = session;

  const { pathname } = url;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !session) {
    return redirect('/login');
  }

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    const result = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session!.user.id)
      .single();

    const role = (result.data as { role?: string } | null)?.role;
    if (role !== 'admin') {
      return redirect('/dashboard');
    }
  }

  return next();
});
