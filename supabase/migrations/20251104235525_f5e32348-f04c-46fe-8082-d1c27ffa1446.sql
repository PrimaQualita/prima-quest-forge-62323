-- Fix Security Issue: Remove public write access to trainings table
DROP POLICY IF EXISTS "Public delete access for trainings" ON public.trainings;
DROP POLICY IF EXISTS "Public insert access for trainings" ON public.trainings;
DROP POLICY IF EXISTS "Public update access for trainings" ON public.trainings;
DROP POLICY IF EXISTS "Public read access for trainings" ON public.trainings;

-- Add admin-only policies for trainings management
CREATE POLICY "Admins can insert trainings" 
ON public.trainings 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trainings" 
ON public.trainings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trainings" 
ON public.trainings 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));