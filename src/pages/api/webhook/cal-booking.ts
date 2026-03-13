import type { APIRoute } from 'astro';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase';

function verifyCalSignature(body: string, signature: string, secret: string): boolean {
  const computed = createHmac('sha256', secret).update(body).digest('hex');
  return computed === signature;
}

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();

  const signature = request.headers.get('X-Cal-Signature-256') ?? '';
  const secret = import.meta.env.CAL_WEBHOOK_SECRET;
  if (!secret || !verifyCalSignature(rawBody, signature, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;

  if (payload.triggerEvent !== 'BOOKING_CREATED') {
    return new Response('OK', { status: 200 });
  }

  const booking = payload.payload as Record<string, unknown>;
  const attendees = booking.attendees as Array<{ email: string; name?: string }> | undefined;
  const attendeeEmail = attendees?.[0]?.email;

  if (!attendeeEmail) {
    return new Response('Missing attendee email', { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', attendeeEmail)
    .single();

  if (!profile) {
    return new Response('OK', { status: 200 });
  }

  const scheduledAt = booking.startTime as string;
  const videoCallData = booking.videoCallData as Record<string, unknown> | undefined;
  const meetingUrl =
    (videoCallData?.url as string | undefined) ??
    (booking.meetingUrl as string | undefined) ??
    '';

  await supabaseAdmin.from('mentorship_sessions').upsert({
    user_id: profile.id,
    scheduled_at: scheduledAt,
    meeting_url: meetingUrl,
    status: 'scheduled',
    reminder_sent: false,
  });

  return new Response('OK', { status: 200 });
};
