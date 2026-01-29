
-- =====================================================
-- CORREÇÃO: Requerer autenticação para cadastro de fornecedores
-- =====================================================

-- 1. Atualizar política de INSERT para requerer autenticação
DROP POLICY IF EXISTS "Anyone can insert supplier info (form submission)" ON public.supplier_due_diligence;

-- Permitir INSERT apenas para usuários autenticados, vinculando ao seu próprio user_id
CREATE POLICY "Authenticated users can register as supplier"
ON public.supplier_due_diligence
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM supplier_due_diligence 
    WHERE user_id = auth.uid()
  )
);
