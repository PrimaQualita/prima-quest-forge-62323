-- Adicionar campos de nome completo e avatar à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Atualizar profiles existentes com nome dos employees correspondentes
UPDATE public.profiles p
SET full_name = e.name
FROM public.employees e
WHERE p.id = e.user_id AND p.full_name IS NULL;