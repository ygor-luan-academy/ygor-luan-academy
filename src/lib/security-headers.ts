const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' https://player.vimeo.com",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "frame-src https://player.vimeo.com",
  "connect-src 'self' https://*.supabase.co https://api.resend.com",
  'report-uri /api/csp-report',
].join('; ');

export function getSecurityHeaders(url: URL): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy-Report-Only': CSP_REPORT_ONLY,
  };

  if (url.protocol === 'https:') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

export function applySecurityHeaders(response: Response, url: URL): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(getSecurityHeaders(url))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
