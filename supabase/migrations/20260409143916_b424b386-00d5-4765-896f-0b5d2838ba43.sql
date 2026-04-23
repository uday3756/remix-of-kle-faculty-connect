
-- Create remuneration_records table matching XLS structure
CREATE TABLE public.remuneration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sl_no INTEGER,
  department TEXT NOT NULL DEFAULT '',
  semester TEXT,
  exam_date TEXT,
  course_code TEXT,
  course_name TEXT,
  role TEXT NOT NULL DEFAULT '',
  staff_name TEXT NOT NULL DEFAULT '',
  total_students_or_batches NUMERIC,
  students_per_batch NUMERIC,
  num_batches NUMERIC,
  qp_remn_per_batch NUMERIC,
  remn_per_batch NUMERIC,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  account_no TEXT,
  pan TEXT,
  ifsc TEXT,
  bank_name TEXT,
  exam_session TEXT DEFAULT 'JAN 2026',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remuneration_records ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access (admin app)
CREATE POLICY "Authenticated users can view all records"
ON public.remuneration_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert records"
ON public.remuneration_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update records"
ON public.remuneration_records FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete records"
ON public.remuneration_records FOR DELETE TO authenticated USING (true);

-- Also allow anon access since current app uses hardcoded login (no Supabase auth)
CREATE POLICY "Anon users can view all records"
ON public.remuneration_records FOR SELECT TO anon USING (true);

CREATE POLICY "Anon users can insert records"
ON public.remuneration_records FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon users can update records"
ON public.remuneration_records FOR UPDATE TO anon USING (true);

CREATE POLICY "Anon users can delete records"
ON public.remuneration_records FOR DELETE TO anon USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_remuneration_records_updated_at
BEFORE UPDATE ON public.remuneration_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for search
CREATE INDEX idx_remuneration_staff_name ON public.remuneration_records USING gin(to_tsvector('english', staff_name));
CREATE INDEX idx_remuneration_department ON public.remuneration_records(department);
CREATE INDEX idx_remuneration_role ON public.remuneration_records(role);

-- Add new columns if table already exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='remuneration_records' AND column_name='students_per_batch') THEN
    ALTER TABLE public.remuneration_records ADD COLUMN students_per_batch NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='remuneration_records' AND column_name='num_batches') THEN
    ALTER TABLE public.remuneration_records ADD COLUMN num_batches NUMERIC;
  END IF;
END $$;
