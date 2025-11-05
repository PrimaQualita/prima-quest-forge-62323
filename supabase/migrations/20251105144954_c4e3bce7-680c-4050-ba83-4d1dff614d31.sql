-- Criar tabela para armazenar múltiplas renovações por contrato
CREATE TABLE public.contract_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.management_contracts(id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_contract_renewals_contract_id ON public.contract_renewals(contract_id);

-- Habilitar RLS
ALTER TABLE public.contract_renewals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins can manage contract renewals"
ON public.contract_renewals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Remover coluna renewal_date da tabela management_contracts (não mais necessária)
ALTER TABLE public.management_contracts DROP COLUMN IF EXISTS renewal_date;