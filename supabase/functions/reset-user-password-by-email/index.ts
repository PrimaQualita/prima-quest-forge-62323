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

    // Verificar se o email existe na tabela employees
    const { data: employeeData } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .eq('email', email.trim())
      .maybeSingle();

    let emailToReset = email.trim();

    // Se encontrou um colaborador com esse email, buscar o email do auth
    if (employeeData?.user_id) {
      const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(employeeData.user_id);
      
      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
      } else if (authUser?.email) {
        emailToReset = authUser.email;
      }
    }

    // Enviar email de reset
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(emailToReset, {
      redirectTo: `${req.headers.get('origin')}/change-password`,
    });

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email de recuperação enviado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro ao resetar senha:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro ao enviar email de recuperação' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
