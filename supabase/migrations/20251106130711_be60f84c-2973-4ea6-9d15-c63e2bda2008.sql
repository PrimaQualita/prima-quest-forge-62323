-- Adicionar campo de tentativas e nota de aprovação nas avaliações
ALTER TABLE training_assessments 
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

-- Adicionar comentários para documentação
COMMENT ON COLUMN training_assessments.attempts IS 'Número de tentativas realizadas pelo colaborador (máximo 5)';
COMMENT ON COLUMN training_assessments.passed IS 'Indica se o colaborador foi aprovado (60% ou mais de acertos)';
COMMENT ON COLUMN training_assessments.last_attempt_at IS 'Data e hora da última tentativa';