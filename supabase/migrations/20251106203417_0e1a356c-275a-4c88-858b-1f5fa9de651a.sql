-- Adicionar coluna supplier_id nas tabelas de tracking
ALTER TABLE document_acknowledgments ADD COLUMN supplier_id UUID REFERENCES supplier_due_diligence(id) ON DELETE CASCADE;
ALTER TABLE training_participations ADD COLUMN supplier_id UUID REFERENCES supplier_due_diligence(id) ON DELETE CASCADE;
ALTER TABLE training_assessments ADD COLUMN supplier_id UUID REFERENCES supplier_due_diligence(id) ON DELETE CASCADE;
ALTER TABLE video_progress ADD COLUMN supplier_id UUID REFERENCES supplier_due_diligence(id) ON DELETE CASCADE;

-- Permitir employee_id ser null quando supplier_id estiver preenchido
ALTER TABLE document_acknowledgments ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE training_participations ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE training_assessments ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE video_progress ALTER COLUMN employee_id DROP NOT NULL;

-- Adicionar constraints para garantir que apenas um dos IDs esteja preenchido
ALTER TABLE document_acknowledgments 
ADD CONSTRAINT check_employee_or_supplier_acknowledgments 
CHECK ((employee_id IS NOT NULL AND supplier_id IS NULL) OR (employee_id IS NULL AND supplier_id IS NOT NULL));

ALTER TABLE training_participations 
ADD CONSTRAINT check_employee_or_supplier_participations 
CHECK ((employee_id IS NOT NULL AND supplier_id IS NULL) OR (employee_id IS NULL AND supplier_id IS NOT NULL));

ALTER TABLE training_assessments 
ADD CONSTRAINT check_employee_or_supplier_assessments 
CHECK ((employee_id IS NOT NULL AND supplier_id IS NULL) OR (employee_id IS NULL AND supplier_id IS NOT NULL));

ALTER TABLE video_progress 
ADD CONSTRAINT check_employee_or_supplier_video 
CHECK ((employee_id IS NOT NULL AND supplier_id IS NULL) OR (employee_id IS NULL AND supplier_id IS NOT NULL));

-- Atualizar políticas RLS para document_acknowledgments
DROP POLICY IF EXISTS "Users can insert their own acknowledgments" ON document_acknowledgments;
DROP POLICY IF EXISTS "Users can update their own acknowledgments" ON document_acknowledgments;
DROP POLICY IF EXISTS "Users can view their own acknowledgments" ON document_acknowledgments;

CREATE POLICY "Users can insert their own acknowledgments" 
ON document_acknowledgments FOR INSERT 
WITH CHECK (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can update their own acknowledgments" 
ON document_acknowledgments FOR UPDATE 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can view their own acknowledgments" 
ON document_acknowledgments FOR SELECT 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

-- Atualizar políticas RLS para training_participations
DROP POLICY IF EXISTS "Users can update their own training progress" ON training_participations;
DROP POLICY IF EXISTS "Users can view their own training progress" ON training_participations;

CREATE POLICY "Users can update their own training progress" 
ON training_participations FOR UPDATE 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can view their own training progress" 
ON training_participations FOR SELECT 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
  OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar políticas RLS para training_assessments
DROP POLICY IF EXISTS "Colaboradores podem atualizar suas avaliações" ON training_assessments;
DROP POLICY IF EXISTS "Colaboradores podem criar suas avaliações" ON training_assessments;
DROP POLICY IF EXISTS "Colaboradores podem ver suas avaliações" ON training_assessments;

CREATE POLICY "Users can update their own assessments" 
ON training_assessments FOR UPDATE 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can create their own assessments" 
ON training_assessments FOR INSERT 
WITH CHECK (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can view their own assessments" 
ON training_assessments FOR SELECT 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

-- Atualizar políticas RLS para video_progress
DROP POLICY IF EXISTS "Users can insert their own video progress" ON video_progress;
DROP POLICY IF EXISTS "Users can update their own video progress" ON video_progress;
DROP POLICY IF EXISTS "Users can view their own video progress" ON video_progress;

CREATE POLICY "Users can insert their own video progress" 
ON video_progress FOR INSERT 
WITH CHECK (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can update their own video progress" 
ON video_progress FOR UPDATE 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can view their own video progress" 
ON video_progress FOR SELECT 
USING (
  (employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()))
  OR
  (supplier_id IN (SELECT id FROM supplier_due_diligence WHERE user_id = auth.uid()))
);