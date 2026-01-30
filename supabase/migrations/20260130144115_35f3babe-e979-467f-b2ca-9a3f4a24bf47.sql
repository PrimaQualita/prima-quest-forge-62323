-- Fix RLS policies for employees table
-- The "Deny anonymous access to employees" policy is RESTRICTIVE with false conditions
-- which doesn't work as intended. We need to remove it since the existing policies
-- already properly restrict access to admins and the employee themselves.

-- Drop the flawed restrictive policy for employees
DROP POLICY IF EXISTS "Deny anonymous access to employees" ON public.employees;

-- Drop the flawed restrictive policy for supplier_due_diligence  
DROP POLICY IF EXISTS "Deny anonymous access to suppliers" ON public.supplier_due_diligence;

-- Also drop the similar policy for profiles table if it exists
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- The remaining policies already properly enforce:
-- employees: 
--   - "Admins can view all employees" (admin role check)
--   - "Users can view their own employee data" (user_id = auth.uid())
--   - "Admins can insert/update/delete employees" (admin role check)
-- 
-- supplier_due_diligence:
--   - "Admins can view supplier info" (admin role check)
--   - "Suppliers can view their own data" (user_id = auth.uid())
--   - "Admins can update supplier info" (admin role check)
--   - "Authenticated users can register as supplier" (user_id = auth.uid())