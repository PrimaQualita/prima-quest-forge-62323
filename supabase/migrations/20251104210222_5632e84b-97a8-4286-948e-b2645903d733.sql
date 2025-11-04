-- Add user_id column to supplier_due_diligence to link with auth.users
ALTER TABLE supplier_due_diligence 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_supplier_user_id ON supplier_due_diligence(user_id);

-- Update RLS policy to allow suppliers to view their own data
CREATE POLICY "Suppliers can view their own data"
ON supplier_due_diligence
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);