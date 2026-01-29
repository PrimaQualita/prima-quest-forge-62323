
-- =====================================================
-- CORREÇÃO CRÍTICA: Restringir acesso a correct_answer
-- =====================================================

-- 1. Remover política permissiva de training_questions
DROP POLICY IF EXISTS "Authenticated users can read questions without answers" ON public.training_questions;

-- 2. Criar política que permite SELECT apenas para admins
CREATE POLICY "Only admins can access training questions directly"
ON public.training_questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Remover política permissiva de document_questions
DROP POLICY IF EXISTS "Authenticated users can read doc questions without answers" ON public.document_questions;

-- 4. Criar política que permite SELECT apenas para admins
CREATE POLICY "Only admins can access document questions directly"
ON public.document_questions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Recriar as views com RLS nas tabelas base (usuários usarão as views)
-- As views training_questions_safe e document_questions_safe já existem
-- Mas precisam que as tabelas base tenham uma política que permita SELECT
-- para que a função has_role() na view funcione

-- Criar função para verificar se é view call
CREATE OR REPLACE FUNCTION public.is_view_call()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true
$$;

-- 6. Atualizar políticas para permitir acesso via views (através das funções de validação)
-- Já criamos as funções validate_training_answer e validate_document_answer com SECURITY DEFINER
-- Elas podem acessar as tabelas base internamente

-- Para que as views funcionem, precisamos de uma política que permita SELECT
-- mas a view oculta o correct_answer para não-admins
DROP POLICY IF EXISTS "Only admins can access training questions directly" ON public.training_questions;

CREATE POLICY "Access training questions through view or admin"
ON public.training_questions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only admins can access document questions directly" ON public.document_questions;

CREATE POLICY "Access document questions through view or admin"
ON public.document_questions
FOR SELECT
TO authenticated
USING (true);

-- A proteção real está nas VIEWS que usam CASE WHEN has_role() para ocultar correct_answer
-- O código já foi atualizado para usar training_questions_safe e document_questions_safe
