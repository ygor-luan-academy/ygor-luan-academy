import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonsService } from '../../../src/services/lessons.service';
import { supabase } from '../../../src/lib/supabase';

const mockLesson = {
  id: 'lesson-1',
  title: 'Técnicas de Navalha',
  slug: 'tecnicas-de-navalha',
  description: null,
  video_url: 'https://vimeo.com/123456',
  thumbnail_url: null,
  duration_minutes: 45,
  module_number: 1,
  order_number: 1,
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('LessonsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('retorna aulas publicadas', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [mockLesson], error: null }),
            }),
          }),
        }),
      } as never);

      const lessons = await LessonsService.getAll();
      expect(lessons).toHaveLength(1);
      expect(lessons[0].title).toBe('Técnicas de Navalha');
    });

    it('retorna array vazio quando não há aulas', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as never);

      const lessons = await LessonsService.getAll();
      expect(lessons).toHaveLength(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      } as never);

      await expect(LessonsService.getAll()).rejects.toThrow('DB error');
    });
  });

  describe('getById', () => {
    it('retorna a aula pelo ID', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockLesson, error: null }),
          }),
        }),
      } as never);

      const lesson = await LessonsService.getById('lesson-1');
      expect(lesson.id).toBe('lesson-1');
    });
  });
});
