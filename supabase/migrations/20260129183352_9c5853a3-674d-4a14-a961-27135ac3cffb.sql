
-- =====================================================
-- CORREÇÃO FINAL: Negar acesso anônimo explicitamente
-- =====================================================

-- 1. Adicionar política de negação de acesso anônimo para supplier_due_diligence
CREATE POLICY "Deny anonymous access to suppliers"
ON public.supplier_due_diligence
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Adicionar política de negação de acesso anônimo para profiles
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. A tabela employees já tem política "Deny anonymous access to employees" com USING (false)
-- Vamos recriar explicitamente para garantir que está funcionando
DROP POLICY IF EXISTS "Deny anonymous access to employees" ON public.employees;

CREATE POLICY "Deny anonymous access to employees"
ON public.employees
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
