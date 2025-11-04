-- Criar tabela para documentos de treinamento
CREATE TABLE IF NOT EXISTS training_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para questões geradas pela IA
CREATE TABLE IF NOT EXISTS training_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array de opções
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela para avaliações dos colaboradores
CREATE TABLE IF NOT EXISTS training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  questions JSONB NOT NULL, -- Array de IDs das questões selecionadas
  answers JSONB, -- Respostas do colaborador
  score INTEGER, -- Pontuação final
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(training_id, employee_id)
);

-- Habilitar RLS
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;

-- Policies para training_documents
CREATE POLICY "Admins podem gerenciar documentos de treinamento"
ON training_documents FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos podem ver documentos de treinamento"
ON training_documents FOR SELECT
TO authenticated
USING (true);

-- Policies para training_questions
CREATE POLICY "Admins podem gerenciar questões"
ON training_questions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores podem ver questões de suas avaliações"
ON training_questions FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT jsonb_array_elements_text(questions)::uuid
    FROM training_assessments
    WHERE employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
);

-- Policies para training_assessments
CREATE POLICY "Colaboradores podem ver suas avaliações"
ON training_assessments FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Colaboradores podem atualizar suas avaliações"
ON training_assessments FOR UPDATE
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins podem gerenciar todas as avaliações"
ON training_assessments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX idx_training_documents_training ON training_documents(training_id);
CREATE INDEX idx_training_questions_training ON training_questions(training_id);
CREATE INDEX idx_training_assessments_training ON training_assessments(training_id);
CREATE INDEX idx_training_assessments_employee ON training_assessments(employee_id);