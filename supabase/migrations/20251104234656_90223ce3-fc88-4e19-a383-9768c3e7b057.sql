-- Fix Security Issue 1: Remove public access to employees table
DROP POLICY IF EXISTS "Allow anonymous read for login verification" ON public.employees;

-- Employees table should only be accessible by authenticated users for their own data or by admins
-- The existing policies "Users can view their own employee data" and "Authenticated admins can manage employees" are sufficient

-- Fix Security Issue 2: Remove public write access to compliance_documents
DROP POLICY IF EXISTS "Public insert access for documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Public update access for documents" ON public.compliance_documents;
DROP POLICY IF EXISTS "Public delete access for documents" ON public.compliance_documents;

-- Add admin-only policies for compliance documents management
CREATE POLICY "Admins can insert documents" 
ON public.compliance_documents 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents" 
ON public.compliance_documents 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents" 
ON public.compliance_documents 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix Security Issue 3: Remove public access to chat conversations and messages
DROP POLICY IF EXISTS "Public read access for conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public insert access for conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public read access for messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public insert access for messages" ON public.chat_messages;

-- Create secure policies for chat conversations
CREATE POLICY "Users can view their own conversations" 
ON public.chat_conversations 
FOR SELECT 
TO authenticated
USING (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own conversations" 
ON public.chat_conversations 
FOR INSERT 
TO authenticated
WITH CHECK (employee_id IN (
  SELECT id FROM public.employees WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all conversations" 
ON public.chat_conversations 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure policies for chat messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (conversation_id IN (
  SELECT id FROM public.chat_conversations 
  WHERE employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can insert messages in their conversations" 
ON public.chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (conversation_id IN (
  SELECT id FROM public.chat_conversations 
  WHERE employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Admins can view all messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));