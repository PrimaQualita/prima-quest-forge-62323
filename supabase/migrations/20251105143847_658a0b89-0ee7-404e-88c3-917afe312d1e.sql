-- Adicionar campo de data de encerramento na tabela management_contracts
ALTER TABLE public.management_contracts 
ADD COLUMN end_date DATE,
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;