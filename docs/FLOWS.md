# Fluxos e Padroes de Codigo

## Fluxo de Compra e Acesso

### 1. Landing -> Checkout
```typescript
// islands/CheckoutButton.tsx
const handleCheckout = async () => {
  const checkoutUrl = await createCheckout({
    productId: 'mentoria-completa',
    price: 997,
    buyerEmail: email
  });

  window.location.href = checkoutUrl;
};
```

### 2. Cakto -> Webhook
```typescript
// src/pages/api/webhook/pagamento.ts
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as CaktoWebhookPayload;

  // Valida secret
  if (!verifyCaktoSecret(body.secret, import.meta.env.CAKTO_WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (body.event !== 'purchase_approved') {
    return new Response('OK', { status: 200 });
  }

  const { email, name } = body.data.customer;

  // 1. Criar usuario
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true,
  });

  // 2. Criar perfil
  await supabaseAdmin.from('profiles').upsert({ id: userId, email, full_name: name, role: 'student' });

  // 3. Registrar pedido
  await supabaseAdmin.from('orders').upsert({
    user_id: userId, payment_id: body.data.id,
    status: 'approved', amount: body.data.amount / 100,
  }, { onConflict: 'payment_id', ignoreDuplicates: true });

  // 4. Enviar email com link de acesso
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });
  void EmailService.sendWelcome(email, name, linkData.properties.action_link);

  return new Response('OK', { status: 200 });
};
```

### 3. Login -> Dashboard
```astro
---
// src/pages/dashboard/aulas.astro
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/login');
}

const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', session.user.id)
  .eq('status', 'approved')
  .single();

if (!order) {
  return Astro.redirect('/sem-acesso');
}

const lessons = await getLessons();
---
```

## Padroes de Codigo

### Estrutura de Components (React Islands)
```tsx
// islands/VideoPlayer.tsx
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';

interface VideoPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
}

export default function VideoPlayer({ lesson, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Side effects aqui
  }, [lesson.id]);

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="video-player">
      {/* JSX */}
    </div>
  );
}
```

### Estrutura de Services
```typescript
// services/lessons.service.ts
import { supabase } from '../lib/supabase';
import type { Lesson } from '../types';

export class LessonsService {
  static async getAll(): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('is_published', true)
      .order('module_number')
      .order('order_number');

    if (error) throw new Error(error.message);
    return data;
  }

  static async getById(id: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
```
