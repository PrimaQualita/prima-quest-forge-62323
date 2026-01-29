
-- =====================================================
-- CORREÇÃO DE SEGURANÇA: Ocultar respostas corretas
-- =====================================================

-- 1. Criar view segura para training_questions (sem correct_answer para não-admins)
CREATE OR REPLACE VIEW public.training_questions_safe AS
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

-- 2. Criar view segura para document_questions (sem correct_answer para não-admins)
CREATE OR REPLACE VIEW public.document_questions_safe AS
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

-- 3. Criar view segura para compliance_documents (sem correct_answer/quiz_options para não-admins)
CREATE OR REPLACE VIEW public.compliance_documents_safe AS
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

-- 4. Função segura para validar respostas de treinamento
CREATE OR REPLACE FUNCTION public.validate_training_answer(
  p_question_id UUID,
  p_user_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer TEXT;
BEGIN
  SELECT correct_answer INTO v_correct_answer
  FROM public.training_questions
  WHERE id = p_question_id;
  
  RETURN v_correct_answer = p_user_answer;
END;
$$;

-- 5. Função segura para validar respostas de documentos
CREATE OR REPLACE FUNCTION public.validate_document_answer(
  p_question_id UUID,
  p_user_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer TEXT;
BEGIN
  SELECT correct_answer INTO v_correct_answer
  FROM public.document_questions
  WHERE id = p_question_id;
  
  RETURN v_correct_answer = p_user_answer;
END;
$$;

-- 6. Função segura para validar quiz de compliance
CREATE OR REPLACE FUNCTION public.validate_compliance_quiz_answer(
  p_document_id UUID,
  p_user_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_answer TEXT;
BEGIN
  SELECT correct_answer INTO v_correct_answer
  FROM public.compliance_documents
  WHERE id = p_document_id;
  
  RETURN v_correct_answer = p_user_answer;
END;
$$;

-- 7. Remover política que permite ver todas as questões de treinamento
DROP POLICY IF EXISTS "Authenticated users can view training questions" ON public.training_questions;

-- 8. Criar política restritiva - apenas admins podem acessar diretamente
CREATE POLICY "Only admins can view training questions directly"
ON public.training_questions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Remover política que permite ver todas as questões de documentos
DROP POLICY IF EXISTS "Usuários autenticados podem ver questões" ON public.document_questions;

-- 10. Criar política restritiva - apenas admins podem acessar diretamente
CREATE POLICY "Only admins can view document questions directly"
ON public.document_questions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 11. Atualizar política de certificates - apenas dono ou admin
DROP POLICY IF EXISTS "Authenticated users can view certificates" ON public.certificates;

-- 12. Criar view segura para certificados com verificação pública
CREATE OR REPLACE VIEW public.certificates_public AS
SELECT 
  verification_code,
  employee_name,
  training_title,
  completion_date,
  score,
  issued_at
FROM public.certificates;

-- 13. Conceder acesso à view de certificados para verificação pública
GRANT SELECT ON public.certificates_public TO anon, authenticated;

-- 14. Conceder acesso às views seguras
GRANT SELECT ON public.training_questions_safe TO authenticated;
GRANT SELECT ON public.document_questions_safe TO authenticated;
GRANT SELECT ON public.compliance_documents_safe TO authenticated;

-- 15. Conceder acesso às funções de validação
GRANT EXECUTE ON FUNCTION public.validate_training_answer TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_document_answer TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_compliance_quiz_answer TO authenticated;
