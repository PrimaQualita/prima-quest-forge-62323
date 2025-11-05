-- Adicionar campos de data de início e data de renovação na tabela management_contracts
ALTER TABLE public.management_contracts 
ADD COLUMN start_date DATE,
ADD COLUMN renewal_date DATE;