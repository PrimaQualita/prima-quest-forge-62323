-- Função para criar usuário automaticamente para colaborador
CREATE OR REPLACE FUNCTION public.auto_create_employee_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf_clean TEXT;
  birth_date_formatted DATE;
  password_text TEXT;
  auth_email TEXT;
  new_user_id UUID;
BEGIN
  -- Só processa se não tiver user_id e tiver CPF e data de nascimento
  IF NEW.user_id IS NULL AND NEW.cpf IS NOT NULL AND NEW.birth_date IS NOT NULL THEN
    
    -- Limpa o CPF (remove formatação)
    cpf_clean := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
    
    -- Formata a senha como DDMMAAAA
    password_text := to_char(NEW.birth_date, 'DDMMYYYY');
    
    -- Cria email único baseado no CPF
    auth_email := cpf_clean || '@primaqualita.local';
    
    -- Verifica se já existe um usuário com esse email
    SELECT id INTO new_user_id
    FROM auth.users
    WHERE email = auth_email
    LIMIT 1;
    
    -- Se não existe, precisamos usar a edge function
    -- Por enquanto, apenas retornamos NEW e o admin precisará criar manualmente
    -- ou podemos adicionar um campo para indicar que precisa criar
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para criar usuário ao inserir colaborador
DROP TRIGGER IF EXISTS trigger_auto_create_employee_user ON public.employees;
CREATE TRIGGER trigger_auto_create_employee_user
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_employee_user();

-- Função para deletar usuário quando colaborador é deletado
CREATE OR REPLACE FUNCTION public.delete_employee_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deleta o usuário associado se existir
  IF OLD.user_id IS NOT NULL THEN
    -- Nota: Os dados do colaborador permanecerão na tabela employees
    -- devido ao CASCADE nas foreign keys
    DELETE FROM auth.users WHERE id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger para deletar usuário ao deletar colaborador
DROP TRIGGER IF EXISTS trigger_delete_employee_user ON public.employees;
CREATE TRIGGER trigger_delete_employee_user
  BEFORE DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_employee_user();

-- Função para processar colaboradores existentes sem user_id
CREATE OR REPLACE FUNCTION public.process_employees_without_users()
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  cpf TEXT,
  needs_user_creation BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.cpf,
    true as needs_user_creation
  FROM public.employees e
  WHERE e.user_id IS NULL
    AND e.cpf IS NOT NULL
    AND e.birth_date IS NOT NULL;
END;
$$;