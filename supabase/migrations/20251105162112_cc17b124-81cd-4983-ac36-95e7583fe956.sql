-- Permitir que o campo email seja nulo na tabela employees
ALTER TABLE public.employees 
ALTER COLUMN email DROP NOT NULL;