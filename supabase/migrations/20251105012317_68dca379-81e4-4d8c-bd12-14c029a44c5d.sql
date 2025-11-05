-- Adicionar novas colunas à tabela employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS management_contract_id UUID REFERENCES public.management_contracts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.employees.department IS 'Departamento do colaborador';
COMMENT ON COLUMN public.employees.management_contract_id IS 'Contrato de gestão associado ao colaborador';
COMMENT ON COLUMN public.employees.job_title IS 'Cargo ou função do colaborador';