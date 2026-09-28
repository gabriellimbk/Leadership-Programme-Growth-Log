-- V1 QoL upgrade: additive production preparation only.
--
-- IMPORTANT
--   * This script never drops, truncates, renames, or replaces
--     public.leadership_growth_log.
--   * Existing submissions and JSON answers remain in place.
--   * Review this script before running it in the Supabase SQL Editor.

-- Keep the existing v1 submissions table and add only missing columns.
CREATE TABLE IF NOT EXISTS public.leadership_growth_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_uid TEXT NOT NULL UNIQUE,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL DEFAULT '',
  teacher_id TEXT NOT NULL DEFAULT 'Teacher A',
  answers JSONB NOT NULL DEFAULT '{}',
  comments JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leadership_growth_log
  ADD COLUMN IF NOT EXISTS student_uid TEXT,
  ADD COLUMN IF NOT EXISTS student_email TEXT,
  ADD COLUMN IF NOT EXISTS student_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS teacher_id TEXT NOT NULL DEFAULT 'Teacher A',
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS leadership_growth_log_student_uid_idx
  ON public.leadership_growth_log (student_uid);

CREATE INDEX IF NOT EXISTS leadership_growth_log_teacher_id_updated_at_idx
  ON public.leadership_growth_log (teacher_id, updated_at DESC);

-- Form configuration remains a separate single-row document. Existing JSON is
-- retained; the app fills missing v2 fields in memory without rewriting it.
CREATE TABLE IF NOT EXISTS public.form_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dynamic teacher directory used by student selection and the admin console.
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS teachers_email_idx
  ON public.teachers (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS teachers_name_idx
  ON public.teachers (LOWER(name));

-- Add known mentors only when their email is not already present.
INSERT INTO public.teachers (name, email)
SELECT seed.name, seed.email
FROM (VALUES
  ('Mr Ridzuan',        'ridzuan@ri.edu.sg'),
  ('Ms Veronica Chua',  'veronica.chua@ri.edu.sg'),
  ('Ms Ruth Rodrigues', 'rodrigues.ruth@ri.edu.sg'),
  ('Ms Tang Mui Kee',   'muikee.tang@ri.edu.sg'),
  ('Mr Teoh Jia Yu',    'jiayu.teoh@ri.edu.sg'),
  ('Mr Ng Kar Kit',     'karkit.ng@ri.edu.sg'),
  ('Mr Sean Lee',       'cheeguan.lee@ri.edu.sg'),
  ('Mr Jason Tan',      'jason.t@ri.edu.sg'),
  ('Ms Felicia Seah',   'felicia.seah@ri.edu.sg'),
  ('Ms Leow Pey Yee',   'peyyee.leow@ri.edu.sg'),
  ('Ms Liyana',         'nurliyana.mt@ri.edu.sg'),
  ('Ms Ng Pei San',     'peisan.ng@ri.edu.sg'),
  ('Ms Arlene Low',     'arlene.chan@ri.edu.sg'),
  ('Mr Gabriel Lim',    'gabriel.lim@ri.edu.sg'),
  ('Mr Lee Chee Keong', 'cheekeong.lee@ri.edu.sg')
) AS seed(name, email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers existing
  WHERE LOWER(existing.email) = LOWER(seed.email)
);

ALTER TABLE public.leadership_growth_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Preserve the live submission policies for compatibility. Student writes
-- currently use Firebase Auth while the Data API receives the Supabase public
-- key. Tightening submission RLS requires configuring Supabase's Firebase
-- third-party Auth integration and migrating existing Firebase users first.
-- Do not remove the live submission policies until that authentication work is
-- complete and tested against a non-production project.

-- Everyone can read the form definition; signed-in Supabase teachers can edit
-- it. TO clauses replace the deprecated auth.role() policy pattern.
DROP POLICY IF EXISTS "config_read_all" ON public.form_config;
DROP POLICY IF EXISTS "config_write_auth" ON public.form_config;

CREATE POLICY "config_read_all"
  ON public.form_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "config_write_auth"
  ON public.form_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Students need the mentor directory during setup. Directory changes are
-- restricted to the administrator accounts recognised by the UI.
DROP POLICY IF EXISTS "teachers_read_all" ON public.teachers;
DROP POLICY IF EXISTS "teachers_write_auth" ON public.teachers;
DROP POLICY IF EXISTS "teachers_write_admin" ON public.teachers;

CREATE POLICY "teachers_read_all"
  ON public.teachers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "teachers_write_admin"
  ON public.teachers FOR ALL
  TO authenticated
  USING (
    LOWER((SELECT auth.jwt() ->> 'email')) = ANY (ARRAY[
      'gabriel.lim@ri.edu.sg',
      'janissa.soh@ri.edu.sg',
      'cheekeong.lee@ri.edu.sg',
      'jialin.ma@ri.edu.sg',
      'kuangwen.chan@ri.edu.sg'
    ])
  )
  WITH CHECK (
    LOWER((SELECT auth.jwt() ->> 'email')) = ANY (ARRAY[
      'gabriel.lim@ri.edu.sg',
      'janissa.soh@ri.edu.sg',
      'cheekeong.lee@ri.edu.sg',
      'jialin.ma@ri.edu.sg',
      'kuangwen.chan@ri.edu.sg'
    ])
  );

GRANT SELECT ON public.form_config, public.teachers TO anon;
GRANT SELECT ON public.form_config, public.teachers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.form_config, public.teachers TO authenticated;

-- Teacher OTP accounts still need to exist in Supabase Authentication before
-- they can request a sign-in code.
