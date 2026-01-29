
-- =====================================================
-- CORREÇÃO: Usar SECURITY INVOKER nas views
-- =====================================================

-- 1. Recriar view de training_questions com SECURITY INVOKER
DROP VIEW IF EXISTS public.training_questions_safe;
CREATE VIEW public.training_questions_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  training_id,
  question,
  options,
  created_at,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN correct_answer
    ELSE NULL
  END as correct_answer
FROM public.training_questions;

-- 2. Recriar view de document_questions com SECURITY INVOKER
DROP VIEW IF EXISTS public.document_questions_safe;
CREATE VIEW public.document_questions_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  document_id,
  question,
  options,
  created_at,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN correct_answer
    ELSE NULL
  END as correct_answer
FROM public.document_questions;

-- 3. Recriar view de compliance_documents com SECURITY INVOKER
DROP VIEW IF EXISTS public.compliance_documents_safe;
CREATE VIEW public.compliance_documents_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  description,
  content,
  category,
  quiz_question,
  quiz_options,
  file_path,
  created_at,
  updated_at,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN correct_answer
    ELSE NULL
  END as correct_answer
FROM public.compliance_documents;

-- 4. Recriar view de certificates com SECURITY INVOKER
DROP VIEW IF EXISTS public.certificates_public;
CREATE VIEW public.certificates_public
WITH (security_invoker = true)
AS
SELECT 
  verification_code,
  employee_name,
  training_title,
  completion_date,
  score,
  issued_at
FROM public.certificates;

-- 5. Conceder permissões nas views
GRANT SELECT ON public.training_questions_safe TO authenticated;
GRANT SELECT ON public.document_questions_safe TO authenticated;
GRANT SELECT ON public.compliance_documents_safe TO authenticated;
GRANT SELECT ON public.certificates_public TO anon, authenticated;

-- 6. Restaurar política de SELECT nas tabelas base para que as views funcionem
-- Mas apenas para admins nas tabelas de questões

-- training_questions: apenas admins acessam diretamente
DROP POLICY IF EXISTS "Only admins can view training questions directly" ON public.training_questions;
CREATE POLICY "Admins can view training questions"
ON public.training_questions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- document_questions: apenas admins acessam diretamente  
DROP POLICY IF EXISTS "Only admins can view document questions directly" ON public.document_questions;
CREATE POLICY "Admins can view document questions"
ON public.document_questions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
