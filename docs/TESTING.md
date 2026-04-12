# Estrategia de Testes (TDD)

## Piramide de Testes

```
         /\
        /  \  E2E (10%)
       /────\
      /      \  Integration (20%)
     /────────\
    /          \  Unit (70%)
   /────────────\
```

## Unit Tests

```typescript
// tests/unit/services/lessons.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LessonsService } from '../../../src/services/lessons.service';

describe('LessonsService', () => {
  beforeEach(() => {
    // Setup
  });

  it('deve retornar lista de aulas publicadas', async () => {
    const lessons = await LessonsService.getAll();

    expect(lessons).toBeInstanceOf(Array);
    expect(lessons.every(l => l.is_published)).toBe(true);
  });

  it('deve lancar erro quando aula nao existe', async () => {
    await expect(
      LessonsService.getById('invalid-id')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Authentication Flow', () => {
  it('deve fazer login com credenciais validas', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
  });

  it('deve rejeitar login com senha incorreta', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain('Invalid');
  });
});
```

## E2E Tests (Playwright)

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Compra', () => {
  test('deve completar compra com sucesso', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ygor Luan Pro');

    await page.click('button:has-text("Comprar Agora")');
    await expect(page).toHaveURL(/cakto/);
  });
});
```
