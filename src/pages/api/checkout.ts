import type { APIRoute } from 'astro';
import { preference } from '../../lib/mercadopago';

export const POST: APIRoute = async ({ request }) => {
  const { email } = await request.json() as { email?: string };

  if (!email) {
    return new Response(JSON.stringify({ error: 'E-mail obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const siteUrl = import.meta.env.PUBLIC_SITE_URL;

  const response = await preference.create({
    body: {
      items: [
        {
          id: 'mentoria-completa',
          title: 'Mentoria Completa – Ygor Luan Academy',
          description: 'Acesso completo ao curso + sessão de mentoria 1:1',
          quantity: 1,
          unit_price: 997,
          currency_id: 'BRL',
        },
      ],
      payer: { email },
      back_urls: {
        success: `${siteUrl}/obrigado`,
        failure: `${siteUrl}/?checkout=failed`,
        pending: `${siteUrl}/obrigado?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhook/pagamento`,
      metadata: { buyer_email: email },
    },
  });

  return new Response(
    JSON.stringify({ checkoutUrl: response.init_point, preferenceId: response.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
