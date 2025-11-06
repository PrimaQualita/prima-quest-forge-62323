-- Criar tabela para múltiplas perguntas por documento
CREATE TABLE IF NOT EXISTS public.document_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.document_questions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins podem gerenciar questões de documentos"
ON public.document_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuários autenticados podem ver questões"
ON public.document_questions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Índice para melhor performance
CREATE INDEX idx_document_questions_document_id ON public.document_questions(document_id);