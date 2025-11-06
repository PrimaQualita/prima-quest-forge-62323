-- Adicionar política para permitir que colaboradores criem suas próprias avaliações
CREATE POLICY "Colaboradores podem criar suas avaliações"
ON public.training_assessments
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id 
    FROM public.employees 
    WHERE user_id = auth.uid()
  )
);