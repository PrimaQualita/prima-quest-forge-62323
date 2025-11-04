-- Adicionar colunas para gestão de status e certificados de fornecedores
ALTER TABLE supplier_due_diligence
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS certificate_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS certificate_url text;

-- Comentário na tabela
COMMENT ON TABLE supplier_due_diligence IS 'Armazena informações de due diligence de fornecedores com status de aprovação';

-- Índice para buscar fornecedores por status
CREATE INDEX IF NOT EXISTS idx_supplier_due_diligence_status ON supplier_due_diligence(status);

-- Atualizar RLS para fornecedores aprovados visualizarem seus dados
CREATE POLICY "Fornecedores aprovados podem ver seus dados"
ON supplier_due_diligence
FOR SELECT
USING (status = 'approved' AND email = current_setting('request.jwt.claims', true)::json->>'email');