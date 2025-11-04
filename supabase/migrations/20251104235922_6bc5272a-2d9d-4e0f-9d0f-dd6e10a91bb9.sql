-- Fix Security Issue: Prevent anonymous access to employees table
-- Add explicit policy to deny unauthenticated access

CREATE POLICY "Deny anonymous access to employees" 
ON public.employees 
FOR ALL
TO anon
USING (false);

-- Ensure all existing policies are properly scoped to authenticated users only
-- This provides defense in depth by explicitly blocking anonymous access