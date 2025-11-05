-- Remover trigger antigo
DROP TRIGGER IF EXISTS update_contract_status_on_renewal ON public.contract_renewals;

-- Criar função melhorada para atualizar data de vigência
CREATE OR REPLACE FUNCTION public.update_contract_end_date_from_renewals()
RETURNS TRIGGER AS $$
DECLARE
  latest_renewal_end_date DATE;
  contract_uuid UUID;
BEGIN
  -- Determinar qual contract_id usar dependendo da operação
  IF TG_OP = 'DELETE' THEN
    contract_uuid := OLD.contract_id;
  ELSE
    contract_uuid := NEW.contract_id;
  END IF;
  
  -- Buscar a data final mais recente das renovações deste contrato
  SELECT MAX(renewal_end_date) INTO latest_renewal_end_date
  FROM public.contract_renewals
  WHERE contract_id = contract_uuid;
  
  -- Atualizar a data de vigência e status do contrato
  IF latest_renewal_end_date IS NOT NULL THEN
    UPDATE public.management_contracts
    SET end_date = latest_renewal_end_date,
        is_active = (latest_renewal_end_date >= CURRENT_DATE)
    WHERE id = contract_uuid;
  END IF;
  
  -- Retornar o registro apropriado baseado na operação
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar triggers para todas as operações em renovações
CREATE TRIGGER update_contract_on_renewal_insert
AFTER INSERT ON public.contract_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_end_date_from_renewals();

CREATE TRIGGER update_contract_on_renewal_update
AFTER UPDATE ON public.contract_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_end_date_from_renewals();

CREATE TRIGGER update_contract_on_renewal_delete
AFTER DELETE ON public.contract_renewals
FOR EACH ROW
EXECUTE FUNCTION public.update_contract_end_date_from_renewals();