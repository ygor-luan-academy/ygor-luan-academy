// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetUser, mockUpdateUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
  })),
}));

import ResetPasswordForm from '../../../src/islands/ResetPasswordForm';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra erro quando não há sessão ativa (getUser retorna null)', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(
        screen.getByText('Link inválido ou expirado. Solicite um novo.'),
      ).toBeInTheDocument();
    });
  });

  it('deve mostrar erro quando getUser retornar usuário nulo', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(
        screen.getByText('Link inválido ou expirado. Solicite um novo.'),
      ).toBeInTheDocument();
    });
  });

  it('mostra formulário quando o token de recovery é válido', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });
  });

  it('mostra erro quando as senhas não conferem', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'senha123' } });
    fireEvent.change(confirmar, { target: { value: 'diferente' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument();
  });

  it('mostra erro quando updateUser falhar', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });
    mockUpdateUser.mockResolvedValueOnce({ error: { message: 'Senha muito fraca' } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'senha123' } });
    fireEvent.change(confirmar, { target: { value: 'senha123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Senha muito fraca')).toBeInTheDocument();
    });
  });

  it('redireciona para /login após sucesso', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } } });
    mockUpdateUser.mockResolvedValueOnce({ data: { user: {} }, error: null });

    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    });

    const [novaSenha, confirmar] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(novaSenha, { target: { value: 'novaSenha123' } });
    fireEvent.change(confirmar, { target: { value: 'novaSenha123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /redefinir/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Senha redefinida/i)).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(window.location.href).toBe('/login');

    vi.useRealTimers();
  });
});
