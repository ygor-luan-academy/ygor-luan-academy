import { supabaseAdmin } from '../lib/supabase';
import type { Material } from '../types';

export class MaterialsService {
  static async getByLessonId(lessonId: string): Promise<Material[]> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async create(input: {
    lesson_id: string;
    title: string;
    file_url: string;
    file_type?: string | null;
  }): Promise<Material> {
    const { data, error } = await supabaseAdmin
      .from('materials')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('materials')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
