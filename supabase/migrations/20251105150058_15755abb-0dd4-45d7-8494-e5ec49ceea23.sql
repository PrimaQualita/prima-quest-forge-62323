-- Atualizar função para calcular automaticamente a data de vigência do contrato
CREATE OR REPLACE FUNCTION public.check_and_update_contract_status()
RETURNS TRIGGER AS $$
DECLARE
  latest_renewal_end_date DATE;
BEGIN
  -- Buscar a data final mais recente das renovações deste contrato
  SELECT MAX(renewal_end_date) INTO latest_renewal_end_date
  FROM public.contract_renewals
  WHERE contract_id = NEW.contract_id;
  
  -- Verificar se a data final da renovação já passou
  IF NEW.renewal_end_date < CURRENT_DATE THEN
    -- Atualizar o contrato para encerrado e definir a data de vigência
    UPDATE public.management_contracts
    SET is_active = false,
        end_date = latest_renewal_end_date
    WHERE id = NEW.contract_id;
  ELSE
    -- Se ainda está dentro do período, garantir que está ativo e atualizar a data de vigência
    UPDATE public.management_contracts
    SET is_active = true,
        end_date = latest_renewal_end_date
    WHERE id = NEW.contract_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;