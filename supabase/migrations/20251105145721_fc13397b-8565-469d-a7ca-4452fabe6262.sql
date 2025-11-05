-- Adicionar campos de período à tabela contract_renewals
ALTER TABLE public.contract_renewals
ADD COLUMN renewal_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN renewal_end_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Criar função para verificar e atualizar status do contrato automaticamente
CREATE OR REPLACE FUNCTION public.check_and_update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a data final da renovação já passou
  IF NEW.renewal_end_date < CURRENT_DATE THEN
    -- Atualizar o contrato para encerrado
    UPDATE public.management_contracts
    SET is_active = false
    WHERE id = NEW.contract_id;
  ELSE
    -- Se ainda está dentro do período, garantir que está ativo
    UPDATE public.management_contracts
    SET is_active = true
    WHERE id = NEW.contract_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar a função após inserir ou atualizar renovações
CREATE TRIGGER update_contract_status_on_renewal
AFTER INSERT OR UPDATE ON public.contract_renewals
FOR EACH ROW
EXECUTE FUNCTION public.check_and_update_contract_status();