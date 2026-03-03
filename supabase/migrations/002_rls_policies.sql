-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Helper: verifica se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: verifica se o usuário tem acesso pago
CREATE OR REPLACE FUNCTION has_paid_access()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE user_id = auth.uid() AND status = 'approved'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- === PROFILES ===
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- === ORDERS ===
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- === LESSONS ===
CREATE POLICY "lessons_select_published" ON public.lessons
  FOR SELECT USING (
    (is_published = TRUE AND has_paid_access()) OR is_admin()
  );

CREATE POLICY "lessons_all_admin" ON public.lessons
  FOR ALL USING (is_admin());

-- === MODULES ===
CREATE POLICY "modules_select_paid" ON public.modules
  FOR SELECT USING (has_paid_access() OR is_admin());

CREATE POLICY "modules_all_admin" ON public.modules
  FOR ALL USING (is_admin());

-- === USER_PROGRESS ===
CREATE POLICY "progress_select_own" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_insert_own" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update_own" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- === MENTORSHIP_SESSIONS ===
CREATE POLICY "mentorship_select_own" ON public.mentorship_sessions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- === MATERIALS ===
CREATE POLICY "materials_select_paid" ON public.materials
  FOR SELECT USING (has_paid_access() OR is_admin());
