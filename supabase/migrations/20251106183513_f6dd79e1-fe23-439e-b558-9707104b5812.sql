-- Remover política antiga que causa problema circular
DROP POLICY IF EXISTS "Employees can view questions from their trainings" ON public.training_questions;

-- Nova política: colaboradores autenticados podem ver questões de qualquer treinamento
-- Isso é seguro porque os treinamentos já são visíveis para todos os autenticados
CREATE POLICY "Authenticated users can view training questions"
ON public.training_questions
FOR SELECT
USING (auth.uid() IS NOT NULL);