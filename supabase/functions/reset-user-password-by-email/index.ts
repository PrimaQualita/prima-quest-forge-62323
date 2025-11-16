import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log('Solicitação de reset para email:', email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let emailToReset = email.trim().toLowerCase();
    console.log('Email normalizado:', emailToReset);

    // Primeiro, tentar encontrar na tabela employees
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('user_id, cpf')
      .eq('email', emailToReset)
      .maybeSingle();

    if (employeeError) {
      console.error('Erro ao buscar employee:', employeeError);
    }

    console.log('Employee encontrado:', employeeData);

    // Se encontrou um colaborador, buscar o email do auth
    if (employeeData?.user_id) {
      console.log('Buscando usuário auth com ID:', employeeData.user_id);
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(employeeData.user_id);
      
      if (userError) {
        console.error('Erro ao buscar usuário auth:', userError);
      } else if (authUser?.email) {
        emailToReset = authUser.email;
        console.log('Email do auth encontrado:', emailToReset);
      }
    } else {
      // Se não encontrou na tabela employees, buscar fornecedor
      const { data: supplierData, error: supplierError } = await supabaseAdmin
        .from('supplier_due_diligence')
        .select('user_id')
        .eq('email', emailToReset)
        .maybeSingle();

      if (supplierError) {
        console.error('Erro ao buscar fornecedor:', supplierError);
      }

      console.log('Fornecedor encontrado:', supplierData);

      if (supplierData?.user_id) {
        console.log('Buscando usuário auth do fornecedor com ID:', supplierData.user_id);
        const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(supplierData.user_id);
        
        if (userError) {
          console.error('Erro ao buscar usuário auth do fornecedor:', userError);
        } else if (authUser?.email) {
          emailToReset = authUser.email;
          console.log('Email do auth do fornecedor encontrado:', emailToReset);
        }
      }
    }

    console.log('Enviando email de reset para:', emailToReset);

    // Enviar email de reset
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${req.headers.get('origin')}/change-password`,
    });

    if (resetError) {
      console.error('Erro ao enviar email de reset:', resetError);
      throw resetError;
    }

    console.log('Email de reset enviado com sucesso');

    return new Response(
      JSON.stringify({ success: true, message: 'Email de recuperação enviado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro geral ao resetar senha:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro ao enviar email de recuperação. Verifique se o email está correto.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
