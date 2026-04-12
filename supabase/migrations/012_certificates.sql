CREATE SEQUENCE IF NOT EXISTS public.certificate_seq START 1;

CREATE TABLE public.certificates (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_number TEXT        NOT NULL UNIQUE,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.certificate_number :=
    'YLP-' || EXTRACT(YEAR FROM NEW.issued_at)::TEXT ||
    '-' || LPAD(nextval('public.certificate_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_certificate_number
  BEFORE INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.generate_certificate_number();

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select_own" ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "certificates_select_admin" ON public.certificates
  FOR SELECT
  USING (public.is_admin());
