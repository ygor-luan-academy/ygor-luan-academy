import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../../../src/services/users.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';
import { logger } from '../../../src/lib/logger';

vi.mock('../../../src/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockProfile = {
  id: 'user-1',
  email: 'aluno@test.com',
  full_name: 'Aluno Teste',
  avatar_url: null,
  role: 'student' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAdmin', () => {
    it('retorna todos os perfis ordenados por data de criação', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [mockProfile], error: null }),
        }),
      } as never);

      const profiles = await UsersService.getAllAdmin();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].email).toBe('aluno@test.com');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    });

    it('retorna array vazio quando não há perfis', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as never);

      const profiles = await UsersService.getAllAdmin();
      expect(profiles).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: 'forbidden' } }),
        }),
      } as never);

      await expect(UsersService.getAllAdmin()).rejects.toThrow('forbidden');
    });
  });

  describe('countStudents', () => {
    it('retorna contagem de alunos', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      } as never);

      const count = await UsersService.countStudents();
      expect(count).toBe(5);
    });

    it('retorna 0 quando não há alunos', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      } as never);

      const count = await UsersService.countStudents();
      expect(count).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'permission denied' } }),
        }),
      } as never);

      await expect(UsersService.countStudents()).rejects.toThrow('permission denied');
    });
  });

  describe('isAdmin', () => {
    it('retorna true quando role = admin', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          }),
        }),
      } as never);

      expect(await UsersService.isAdmin('admin-1')).toBe(true);
    });

    it('retorna false quando role = student', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'student' }, error: null }),
          }),
        }),
      } as never);

      expect(await UsersService.isAdmin('user-1')).toBe(false);
    });

    it('retorna false sem logar quando perfil não existe (PGRST116)', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no rows' } }),
          }),
        }),
      } as never);

      expect(await UsersService.isAdmin('user-novo')).toBe(false);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('retorna false e LOGA quando Supabase retorna erro real', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'XX000', message: 'connection lost' } }),
          }),
        }),
      } as never);

      expect(await UsersService.isAdmin('user-1')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'users.isAdmin failed',
        expect.objectContaining({ userId: 'user-1', code: 'XX000' }),
      );
    });

    it('retorna false e LOGA quando query lança exceção', async () => {
      vi.mocked(supabaseAdmin.from).mockImplementationOnce(() => {
        throw new Error('boom');
      });

      expect(await UsersService.isAdmin('user-1')).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'users.isAdmin threw',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });
});
