-- =============================================
-- SECURITY FIX: Remove overly permissive RLS policies
-- =============================================

-- 1. Fix compliance_documents: Remove public read access, keep only authenticated users
DROP POLICY IF EXISTS "Public read access for documents" ON public.compliance_documents;

-- 2. Fix certificates: Change from public to authenticated-only access
DROP POLICY IF EXISTS "Certificados podem ser visualizados por todos" ON public.certificates;

-- Create a secure policy for certificate verification (only by verification code)
CREATE POLICY "Authenticated users can view certificates" 
ON public.certificates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Fix chat_conversations: Remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can access chat" ON public.chat_conversations;

-- 4. Fix chat_messages: Remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can access messages" ON public.chat_messages;

-- 5. Fix supplier_due_diligence: Remove insecure email-based policy
DROP POLICY IF EXISTS "Fornecedores aprovados podem ver seus dados" ON public.supplier_due_diligence;

-- 6. Fix storage: Make supplier-documents bucket private and update policies
UPDATE storage.buckets 
SET public = false 
WHERE id = 'supplier-documents';

-- Remove public storage policies
DROP POLICY IF EXISTS "Public can upload supplier documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view supplier documents" ON storage.objects;

-- Create secure storage policies for authenticated users only
CREATE POLICY "Authenticated users can upload their supplier documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'supplier-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can view their supplier documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'supplier-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can manage all supplier documents"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'supplier-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'supplier-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 7. Create secure RPC for certificate verification (allows lookup by code only)
CREATE OR REPLACE FUNCTION public.verify_certificate(verification_code_input text)
RETURNS TABLE (
  id uuid,
  employee_name text,
  training_title text,
  score integer,
  completion_date timestamp with time zone,
  issued_at timestamp with time zone,
  verification_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.employee_name,
    c.training_title,
    c.score,
    c.completion_date,
    c.issued_at,
    c.verification_code
  FROM public.certificates c
  WHERE c.verification_code = verification_code_input
  LIMIT 1;
END;
$$;