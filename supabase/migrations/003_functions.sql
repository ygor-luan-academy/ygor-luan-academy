-- Trigger: cria perfil automaticamente ao criar usuário via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função: estatísticas de progresso do aluno
CREATE OR REPLACE FUNCTION public.get_student_stats(p_user_id UUID)
RETURNS TABLE (
  total_lessons   BIGINT,
  completed_count BIGINT,
  total_watch_time BIGINT
) AS $$
  SELECT
    COUNT(DISTINCT l.id)                                        AS total_lessons,
    COUNT(DISTINCT up.lesson_id) FILTER (WHERE up.completed)    AS completed_count,
    COALESCE(SUM(up.watch_time), 0)                             AS total_watch_time
  FROM public.lessons l
  LEFT JOIN public.user_progress up
    ON up.lesson_id = l.id AND up.user_id = p_user_id
  WHERE l.is_published = TRUE;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
