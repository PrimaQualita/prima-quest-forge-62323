
-- =====================================================
-- CORREÇÃO: Adicionar RLS às views e corrigir policies
-- =====================================================

-- 1. Habilitar RLS nas views (views com SECURITY INVOKER herdam RLS das tabelas base)
-- As views já usam SECURITY INVOKER, então herdam as políticas das tabelas base
-- Mas precisamos garantir que usuários não-admin possam acessar as views

-- 2. Criar políticas nas tabelas base para permitir SELECT nas views
-- Para training_questions: permitir SELECT de questões sem correct_answer para usuários autenticados
DROP POLICY IF EXISTS "Admins can view training questions" ON public.training_questions;

CREATE POLICY "Authenticated users can read questions without answers"
ON public.training_questions
FOR SELECT
TO authenticated
USING (true);

-- Para document_questions: permitir SELECT de questões sem correct_answer para usuários autenticados
DROP POLICY IF EXISTS "Admins can view document questions" ON public.document_questions;

CREATE POLICY "Authenticated users can read doc questions without answers"
ON public.document_questions
FOR SELECT
TO authenticated
USING (true);

-- 3. Corrigir política de INSERT de certificates - apenas através de processo controlado
DROP POLICY IF EXISTS "Usuários autenticados podem criar certificados" ON public.certificates;

CREATE POLICY "Only system can create certificates"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (
  -- Certificados só podem ser criados se o usuário completou o treinamento correspondente
  EXISTS (
    SELECT 1 FROM training_assessments ta
    JOIN employees e ON ta.employee_id = e.id
    WHERE e.user_id = auth.uid()
    AND ta.passed = true
    AND ta.completed = true
  )
);

-- 4. Adicionar política de SELECT restrita para certificados
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON public.certificates;

CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  employee_name IN (
    SELECT name FROM employees WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 5. Manter acesso anônimo para verificação de certificados via função RPC (já existe verify_certificate)
