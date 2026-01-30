-- Fix 1: due_diligence_questions - Remove public access, require authentication
DROP POLICY IF EXISTS "Public can view active questions" ON public.due_diligence_questions;

CREATE POLICY "Authenticated users can view active questions" 
ON public.due_diligence_questions 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Fix 2: training_questions - Restrict direct table access to admins only
-- Drop the overly permissive policy that exposes correct_answer
DROP POLICY IF EXISTS "Access training questions through view or admin" ON public.training_questions;

-- Only admins can directly access the table (with correct_answer)
-- Non-admins must use the training_questions_safe view
CREATE POLICY "Only admins can access training questions directly" 
ON public.training_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: document_questions - Same issue, restrict direct access
DROP POLICY IF EXISTS "Access document questions through view or admin" ON public.document_questions;

CREATE POLICY "Only admins can access document questions directly" 
ON public.document_questions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: certificates_public is a VIEW, not a table. Views inherit RLS from underlying tables.
-- The certificates table already has proper RLS. The VIEW is used for public verification via RPC.
-- The verify_certificate RPC function (SECURITY DEFINER) handles public verification securely.