-- Fix Security Issue: Strengthen RLS policies on employees table
-- Drop the broad ALL policy and create specific granular policies

DROP POLICY IF EXISTS "Authenticated admins can manage employees" ON public.employees;

-- Create explicit admin policies for better security audit trail
CREATE POLICY "Admins can view all employees" 
ON public.employees 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert employees" 
ON public.employees 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employees" 
ON public.employees 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees" 
ON public.employees 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own basic data (policy already exists, kept as is)
-- "Users can view their own employee data" already restricts to user_id = auth.uid()