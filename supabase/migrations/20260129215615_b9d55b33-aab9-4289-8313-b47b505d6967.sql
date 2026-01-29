-- Add is_active column to employees table to support deactivation instead of deletion
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create an index for efficient filtering of active employees
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

-- Add deactivated_at column to track when an employee was deactivated
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone;

-- Create a function to check if an employee is active
CREATE OR REPLACE FUNCTION public.is_employee_active(employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.employees WHERE id = employee_id),
    false
  )
$$;