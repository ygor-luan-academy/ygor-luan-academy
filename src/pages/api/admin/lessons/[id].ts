import type { APIRoute } from 'astro';
import { LessonsService } from '../../../../services/lessons.service';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.session) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  const body = await request.json() as Record<string, unknown>;
  const lesson = await LessonsService.update(id, body);

  return new Response(JSON.stringify(lesson), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.session) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  await LessonsService.togglePublish(id, false);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
