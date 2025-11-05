-- Remove a constraint UNIQUE do campo email para permitir múltiplos registros com email nulo ou vazio
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_email_key;

-- Criar índice não-único no email para manter performance de busca
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email) WHERE email IS NOT NULL;