import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { employee } = await req.json();
    
    if (!employee || !employee.cpf || !employee.birth_date) {
      throw new Error('Dados do funcionário incompletos');
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Clean CPF (remove any formatting)
    const cpf = employee.cpf.replace(/\D/g, '');
    
    // Format birth date to use as password (only numbers: DDMMYYYY)
    const birthDate = new Date(employee.birth_date);
    const day = String(birthDate.getDate()).padStart(2, '0');
    const month = String(birthDate.getMonth() + 1).padStart(2, '0');
    const year = birthDate.getFullYear();
    const password = `${day}${month}${year}`;

    // Create a unique email using CPF (for auth system requirements)
    const authEmail = `${cpf}@primaqualita.local`;

    console.log('Creating user with CPF:', cpf);

    // Try to get existing user first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === authEmail);

    let userId: string;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Create user in auth with CPF-based email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          employee_id: employee.id,
          cpf: cpf,
          actual_email: employee.email
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }

      console.log('User created successfully:', userData.user.id);
      userId = userData.user.id;
    }

    // Create profile first (required by foreign key)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        cpf: cpf,
        birth_date: employee.birth_date,
        first_login: true
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    // Update employee with user_id
    const { error: updateError } = await supabaseAdmin
      .from('employees')
      .update({ user_id: userId })
      .eq('id', employee.id);

    if (updateError) {
      console.error('Error updating employee:', updateError);
      throw updateError;
    }

    // If employee is a manager, add admin role
    if (employee.is_manager) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error adding admin role:', roleError);
        throw roleError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Usuário criado com sucesso',
        login_info: {
          username: cpf,
          password_format: 'DDMMAAAA'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-employee-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
