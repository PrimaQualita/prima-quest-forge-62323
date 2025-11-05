-- Tornar o campo renewal_date opcional
ALTER TABLE public.contract_renewals 
ALTER COLUMN renewal_date DROP NOT NULL;