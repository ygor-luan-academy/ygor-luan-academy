import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MaterialsService } from '../../../src/services/materials.service';

vi.mock('../../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

import { supabaseAdmin } from '../../../src/lib/supabase';

const mockMaterial = {
  id: 'mat-1',
  lesson_id: 'lesson-1',
  title: 'Checklist PDF',
  file_url: 'https://drive.google.com/file',
  file_type: 'PDF',
  file_size: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('MaterialsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getByLessonId', () => {
    it('retorna lista de materiais de uma aula', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: [mockMaterial], error: null }),
      } as never);

      const result = await MaterialsService.getByLessonId('lesson-1');
      expect(result).toEqual([mockMaterial]);
    });

    it('retorna array vazio quando data é null', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
      } as never);

      const result = await MaterialsService.getByLessonId('lesson-1');
      expect(result).toEqual([]);
    });

    it('lança erro quando Supabase retorna error', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB error' } }),
      } as never);

      await expect(MaterialsService.getByLessonId('lesson-1')).rejects.toThrow('DB error');
    });
  });

  describe('create', () => {
    it('cria e retorna o material', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockMaterial, error: null }),
      } as never);

      const result = await MaterialsService.create({
        lesson_id: 'lesson-1',
        title: 'Checklist PDF',
        file_url: 'https://drive.google.com/file',
        file_type: 'PDF',
      });

      expect(result).toEqual(mockMaterial);
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } }),
      } as never);

      await expect(
        MaterialsService.create({ lesson_id: 'l', title: 't', file_url: 'u' })
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('delete', () => {
    it('deleta sem lançar erro em caso de sucesso', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      } as never);

      await expect(MaterialsService.delete('mat-1')).resolves.toBeUndefined();
    });

    it('lança erro quando delete falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: { message: 'Delete failed' } }),
      } as never);

      await expect(MaterialsService.delete('mat-1')).rejects.toThrow('Delete failed');
    });
  });
});
