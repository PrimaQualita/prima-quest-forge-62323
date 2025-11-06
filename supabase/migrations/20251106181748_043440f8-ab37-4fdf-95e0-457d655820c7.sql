-- Tabela para armazenar certificados emitidos com código de verificação
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_code TEXT NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  training_title TEXT NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  score INTEGER NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Políticas: certificados são públicos para verificação
CREATE POLICY "Certificados podem ser visualizados por todos"
ON public.certificates
FOR SELECT
USING (true);

-- Apenas usuários autenticados podem criar certificados
CREATE POLICY "Usuários autenticados podem criar certificados"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índice para busca rápida por código
CREATE INDEX idx_certificates_verification_code ON public.certificates(verification_code);