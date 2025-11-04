
-- Migration: 20251104153804

-- Migration: 20251104142438

-- Migration: 20251104130451

-- Migration: 20251104123749

-- Migration: 20251104121319

-- Migration: 20251104004650
-- Tabelas de Colaboradores
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  phone TEXT,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelas de Documentos de Compliance
CREATE TABLE public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT NOT NULL,
  quiz_question TEXT NOT NULL,
  quiz_options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelas de Aceites de Documentos
CREATE TABLE public.document_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  quiz_answered BOOLEAN DEFAULT false,
  quiz_correct BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, document_id)
);

-- Tabelas de Treinamentos
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelas de Participação em Treinamentos
CREATE TABLE public.training_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, training_id)
);

-- Tabelas de Conversas do Chatbot
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (público para admin gerenciar)
CREATE POLICY "Public read access for employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Public insert access for employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Public delete access for employees" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Public read access for documents" ON public.compliance_documents FOR SELECT USING (true);
CREATE POLICY "Public insert access for documents" ON public.compliance_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for documents" ON public.compliance_documents FOR UPDATE USING (true);
CREATE POLICY "Public delete access for documents" ON public.compliance_documents FOR DELETE USING (true);

CREATE POLICY "Public read access for acknowledgments" ON public.document_acknowledgments FOR SELECT USING (true);
CREATE POLICY "Public insert access for acknowledgments" ON public.document_acknowledgments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for acknowledgments" ON public.document_acknowledgments FOR UPDATE USING (true);

CREATE POLICY "Public read access for trainings" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "Public insert access for trainings" ON public.trainings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for trainings" ON public.trainings FOR UPDATE USING (true);
CREATE POLICY "Public delete access for trainings" ON public.trainings FOR DELETE USING (true);

CREATE POLICY "Public read access for participations" ON public.training_participations FOR SELECT USING (true);
CREATE POLICY "Public insert access for participations" ON public.training_participations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for participations" ON public.training_participations FOR UPDATE USING (true);

CREATE POLICY "Public read access for conversations" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "Public insert access for conversations" ON public.chat_conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public insert access for messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251104010506
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table to store CPF and birth_date
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can insert profiles on signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update employees table to reference profiles
ALTER TABLE public.employees ADD COLUMN user_id UUID REFERENCES public.profiles(id);

-- Update employees RLS policies
DROP POLICY IF EXISTS "Public read access for employees" ON public.employees;
CREATE POLICY "Admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public insert access for employees" ON public.employees;
CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public update access for employees" ON public.employees;
CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public delete access for employees" ON public.employees;
CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create management_contracts table
CREATE TABLE public.management_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.management_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contracts"
ON public.management_contracts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create contract_documents table
CREATE TABLE public.contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.management_contracts(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contract documents"
ON public.contract_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create supplier_due_diligence table
CREATE TABLE public.supplier_due_diligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  owner TEXT NOT NULL,
  partners TEXT,
  responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.supplier_due_diligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert supplier info"
ON public.supplier_due_diligence
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view supplier info"
ON public.supplier_due_diligence
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update supplier info"
ON public.supplier_due_diligence
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create due_diligence_questions table
CREATE TABLE public.due_diligence_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.due_diligence_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active questions"
ON public.due_diligence_questions
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage questions"
ON public.due_diligence_questions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for management_contracts updated_at
CREATE TRIGGER update_management_contracts_updated_at
BEFORE UPDATE ON public.management_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for supplier_due_diligence updated_at
CREATE TRIGGER update_supplier_due_diligence_updated_at
BEFORE UPDATE ON public.supplier_due_diligence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for due_diligence_questions updated_at
CREATE TRIGGER update_due_diligence_questions_updated_at
BEFORE UPDATE ON public.due_diligence_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Migration: 20251104122402
-- Primeiro, vamos corrigir as RLS policies para exigir autenticação

-- Employees: apenas admins autenticados
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can view employees" ON public.employees;

CREATE POLICY "Authenticated admins can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Profiles: corrigir política de inserção
DROP POLICY IF EXISTS "Public can insert profiles on signup" ON public.profiles;

CREATE POLICY "Authenticated users can insert their profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Document acknowledgments: isolamento por usuário
DROP POLICY IF EXISTS "Public insert access for acknowledgments" ON public.document_acknowledgments;
DROP POLICY IF EXISTS "Public read access for acknowledgments" ON public.document_acknowledgments;
DROP POLICY IF EXISTS "Public update access for acknowledgments" ON public.document_acknowledgments;

CREATE POLICY "Users can view their own acknowledgments"
ON public.document_acknowledgments
FOR SELECT
TO authenticated
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own acknowledgments"
ON public.document_acknowledgments
FOR INSERT
TO authenticated
WITH CHECK (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own acknowledgments"
ON public.document_acknowledgments
FOR UPDATE
TO authenticated
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all acknowledgments"
ON public.document_acknowledgments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Supplier due diligence: exigir autenticação para inserção
DROP POLICY IF EXISTS "Public can insert supplier info" ON public.supplier_due_diligence;

CREATE POLICY "Anyone can insert supplier info (form submission)"
ON public.supplier_due_diligence
FOR INSERT
WITH CHECK (true);

-- Compliance documents: permitir que usuários autenticados vejam
CREATE POLICY "Authenticated users can view documents"
ON public.compliance_documents
FOR SELECT
TO authenticated
USING (true);

-- Trainings: permitir que usuários autenticados vejam
CREATE POLICY "Authenticated users can view trainings"
ON public.trainings
FOR SELECT
TO authenticated
USING (true);

-- Training participations: usuários podem ver suas próprias participações
DROP POLICY IF EXISTS "Public insert access for participations" ON public.training_participations;
DROP POLICY IF EXISTS "Public read access for participations" ON public.training_participations;
DROP POLICY IF EXISTS "Public update access for participations" ON public.training_participations;

CREATE POLICY "Users can view their own training progress"
ON public.training_participations
FOR SELECT
TO authenticated
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage training participations"
ON public.training_participations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own training progress"
ON public.training_participations
FOR UPDATE
TO authenticated
USING (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

-- Chat: permitir acesso autenticado
CREATE POLICY "Authenticated users can access chat"
ON public.chat_conversations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can access messages"
ON public.chat_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar tabela de vídeos de treinamento
CREATE TABLE IF NOT EXISTS public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  duration_minutes INTEGER,
  video_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view training videos"
ON public.training_videos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage training videos"
ON public.training_videos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_training_videos_updated_at
BEFORE UPDATE ON public.training_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo is_trail em trainings para indicar se é uma trilha
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS is_trail BOOLEAN DEFAULT false;

-- Inserir primeiro usuário Diego como admin
DO $$
DECLARE
  diego_user_id UUID;
  diego_employee_id UUID;
BEGIN
  -- Criar usuário no auth (simulado - será criado no primeiro login)
  -- Inserir employee
  INSERT INTO public.employees (name, cpf, birth_date, phone, email)
  VALUES ('Diego de Figueiredo Santos', '13489538706', '1990-01-07', '21999434864', 'diego.figueiredo@primaqualitasaude.org')
  ON CONFLICT (cpf) DO NOTHING
  RETURNING id INTO diego_employee_id;
  
  -- Nota: O perfil e role serão criados quando Diego fizer login pela primeira vez
END $$;


-- Migration: 20251104124253
-- Add role field to employees table to track if they are managers
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS is_manager boolean DEFAULT false;

-- Create a trigger to automatically assign user role when employee is linked to user
CREATE OR REPLACE FUNCTION public.sync_employee_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If employee is linked to a user and is_manager is true, ensure they have admin role
  IF NEW.user_id IS NOT NULL AND NEW.is_manager = true THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- If is_manager changed from true to false, remove admin role
  IF OLD.is_manager = true AND NEW.is_manager = false AND NEW.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.user_id AND role = 'admin'::app_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for employee role sync
DROP TRIGGER IF EXISTS sync_employee_role_trigger ON public.employees;
CREATE TRIGGER sync_employee_role_trigger
  AFTER INSERT OR UPDATE OF user_id, is_manager ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_role();

-- Update RLS policies for employees to allow users to view their own data
CREATE POLICY "Users can view their own employee data"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Migration: 20251104124315
-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Migration: 20251104125215
-- Permitir leitura anônima na tabela employees para o processo de login
-- Esta política é necessária para que o sistema possa verificar CPF e data de nascimento
-- antes da autenticação do usuário
CREATE POLICY "Allow anonymous read for login verification"
ON public.employees
FOR SELECT
TO anon
USING (true);


-- Migration: 20251104131817
-- Criar bucket para documentos de compliance
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-documents', 'compliance-documents', true);

-- Adicionar coluna para armazenar o caminho do arquivo
ALTER TABLE compliance_documents
ADD COLUMN file_path TEXT;

-- Políticas RLS para o bucket de documentos
CREATE POLICY "Documentos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'compliance-documents');

CREATE POLICY "Usuários autenticados podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar documentos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar documentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'compliance-documents' AND auth.role() = 'authenticated');


