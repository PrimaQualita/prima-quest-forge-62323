-- Tornar os campos de quiz da tabela compliance_documents nullable
-- pois agora usaremos a tabela document_questions para armazenar múltiplas perguntas

ALTER TABLE public.compliance_documents 
ALTER COLUMN quiz_question DROP NOT NULL,
ALTER COLUMN quiz_options DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL;