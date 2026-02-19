
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_employees', (SELECT COUNT(*) FROM public.employees WHERE is_active = true),
    'inactive_employees', (SELECT COUNT(*) FROM public.employees WHERE is_active = false),
    'total_employees', (SELECT COUNT(*) FROM public.employees),
    'departments', (SELECT json_agg(DISTINCT department) FROM public.employees WHERE department IS NOT NULL AND is_active = true),
    'managers_count', (SELECT COUNT(*) FROM public.employees WHERE is_manager = true AND is_active = true),
    'active_contracts', (SELECT COUNT(*) FROM public.management_contracts WHERE is_active = true),
    'inactive_contracts', (SELECT COUNT(*) FROM public.management_contracts WHERE is_active = false),
    'total_contracts', (SELECT COUNT(*) FROM public.management_contracts),
    'total_suppliers', (SELECT COUNT(*) FROM public.supplier_due_diligence),
    'suppliers_approved', (SELECT COUNT(*) FROM public.supplier_due_diligence WHERE status = 'approved'),
    'suppliers_pending', (SELECT COUNT(*) FROM public.supplier_due_diligence WHERE status = 'pending'),
    'suppliers_rejected', (SELECT COUNT(*) FROM public.supplier_due_diligence WHERE status = 'rejected'),
    'total_trainings', (SELECT COUNT(*) FROM public.trainings),
    'total_training_videos', (SELECT COUNT(*) FROM public.training_videos),
    'total_documents', (SELECT COUNT(*) FROM public.compliance_documents),
    'total_participations', (SELECT COUNT(*) FROM public.training_participations),
    'completed_participations', (SELECT COUNT(*) FROM public.training_participations WHERE completed = true),
    'total_acknowledgments', (SELECT COUNT(*) FROM public.document_acknowledgments WHERE acknowledged_at IS NOT NULL),
    'total_quiz_correct', (SELECT COUNT(*) FROM public.document_acknowledgments WHERE quiz_correct = true),
    'total_certificates', (SELECT COUNT(*) FROM public.certificates),
    'employees_by_department', (
      SELECT json_agg(json_build_object('department', COALESCE(department, 'Sem departamento'), 'count', cnt))
      FROM (SELECT department, COUNT(*) as cnt FROM public.employees WHERE is_active = true GROUP BY department ORDER BY cnt DESC) sub
    ),
    'employees_by_contract', (
      SELECT json_agg(json_build_object('contract_name', COALESCE(mc.name, 'Sem contrato'), 'count', cnt))
      FROM (
        SELECT management_contract_id, COUNT(*) as cnt 
        FROM public.employees WHERE is_active = true 
        GROUP BY management_contract_id ORDER BY cnt DESC
      ) sub
      LEFT JOIN public.management_contracts mc ON mc.id = sub.management_contract_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
