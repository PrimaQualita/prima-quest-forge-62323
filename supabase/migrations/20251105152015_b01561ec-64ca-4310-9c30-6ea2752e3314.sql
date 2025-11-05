-- Forçar recálculo das datas de vigência para todos os contratos com renovações
UPDATE public.management_contracts mc
SET 
  end_date = (
    SELECT MAX(renewal_end_date)
    FROM public.contract_renewals cr
    WHERE cr.contract_id = mc.id
  ),
  is_active = (
    SELECT MAX(renewal_end_date) >= CURRENT_DATE
    FROM public.contract_renewals cr
    WHERE cr.contract_id = mc.id
  )
WHERE EXISTS (
  SELECT 1
  FROM public.contract_renewals cr
  WHERE cr.contract_id = mc.id
);