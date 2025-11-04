-- Add file upload columns to supplier_due_diligence table
ALTER TABLE supplier_due_diligence 
ADD COLUMN certificate_file_path text,
ADD COLUMN kpmg_report_file_path text,
ADD COLUMN total_score integer DEFAULT 0;

-- Create storage bucket for supplier documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-documents', 'supplier-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for supplier documents bucket
CREATE POLICY "Admins can manage supplier documents"
ON storage.objects FOR ALL
USING (bucket_id = 'supplier-documents' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'supplier-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Public can upload supplier documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'supplier-documents');

CREATE POLICY "Public can view supplier documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplier-documents');

-- Update existing suppliers with calculated scores
UPDATE supplier_due_diligence sd
SET total_score = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN (sd.responses->q.id::text) = '"sim"' THEN q.yes_points
      WHEN (sd.responses->q.id::text) = '"não"' THEN q.no_points
      ELSE 0
    END
  ), 0)
  FROM due_diligence_questions q
  WHERE q.is_active = true
)
WHERE sd.responses IS NOT NULL;