import { describe, expect, it } from 'vitest';

import {
  resolveCallbackRedirect,
  shouldRedirectAuthenticatedUserFromResetPage,
} from '../../../src/lib/auth-navigation';

describe('auth navigation helpers', () => {
  describe('resolveCallbackRedirect', () => {
    it('acrescenta recovery=1 ao redirect de redefinição de senha', () => {
      expect(resolveCallbackRedirect('/redefinir-senha')).toBe('/redefinir-senha?recovery=1');
    });

    it('preserva query string existente ao acrescentar recovery=1', () => {
      expect(resolveCallbackRedirect('/redefinir-senha?origem=email')).toBe('/redefinir-senha?origem=email&recovery=1');
    });

    it('mantém outros redirects inalterados', () => {
      expect(resolveCallbackRedirect('/dashboard')).toBe('/dashboard');
    });
  });

  describe('shouldRedirectAuthenticatedUserFromResetPage', () => {
    it('permite a página quando usuário autenticado chega por recovery', () => {
      expect(shouldRedirectAuthenticatedUserFromResetPage({ hasUser: true, recovery: '1' })).toBe(false);
    });

    it('redireciona usuário autenticado em acesso comum', () => {
      expect(shouldRedirectAuthenticatedUserFromResetPage({ hasUser: true, recovery: null })).toBe(true);
    });

    it('não redireciona visitante sem sessão', () => {
      expect(shouldRedirectAuthenticatedUserFromResetPage({ hasUser: false, recovery: null })).toBe(false);
    });
  });
});
