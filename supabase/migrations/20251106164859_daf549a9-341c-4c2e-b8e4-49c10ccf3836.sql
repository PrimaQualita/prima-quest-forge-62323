-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Colaboradores podem ver questões de suas avaliações" ON training_questions;

-- Create a simpler policy that allows employees to see questions from trainings they're participating in
CREATE POLICY "Employees can view questions from their trainings"
ON training_questions FOR SELECT
USING (
  training_id IN (
    SELECT DISTINCT tp.training_id 
    FROM training_participations tp
    INNER JOIN employees e ON e.id = tp.employee_id
    WHERE e.user_id = auth.uid()
  )
  OR
  training_id IN (
    SELECT DISTINCT ta.training_id 
    FROM training_assessments ta
    INNER JOIN employees e ON e.id = ta.employee_id
    WHERE e.user_id = auth.uid()
  )
);