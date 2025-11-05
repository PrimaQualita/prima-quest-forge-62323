-- Remove o trigger que não pode funcionar (não podemos criar usuários do Auth direto do banco)
DROP TRIGGER IF EXISTS trigger_auto_create_employee_user ON public.employees;
DROP FUNCTION IF EXISTS public.auto_create_employee_user();

-- Mantém a função para deletar usuário quando colaborador é deletado
-- Esta função já foi criada na migração anterior e está funcionando

-- Mantém a função para processar colaboradores existentes sem user_id
-- Esta função já foi criada na migração anterior e está funcionando