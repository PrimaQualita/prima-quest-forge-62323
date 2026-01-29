import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user authentication using getClaims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Authentication failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string;

    // Initialize admin client for role check and password reset
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Admin check failed:', roleError || 'No admin role found');
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { cpf } = await req.json()

    if (!cpf) {
      return new Response(
        JSON.stringify({ error: 'CPF is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean CPF (remove dots and dashes)
    const cleanedCpf = cpf.replace(/\D/g, '')

    console.log('Admin', userId, 'resetting password for employee with CPF:', cleanedCpf)

    // Find employee by CPF
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('user_id, birth_date')
      .eq('cpf', cleanedCpf)
      .maybeSingle()

    if (employeeError) {
      console.error('Error finding employee:', employeeError)
      return new Response(
        JSON.stringify({ error: 'Error finding employee', details: employeeError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employee || !employee.user_id) {
      return new Response(
        JSON.stringify({ error: 'Employee not found or not linked to user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format birth date to DDMMYYYY for password
    const birthDate = new Date(employee.birth_date)
    const day = String(birthDate.getDate()).padStart(2, '0')
    const month = String(birthDate.getMonth() + 1).padStart(2, '0')
    const year = birthDate.getFullYear()
    const newPassword = `${day}${month}${year}`

    console.log('Resetting password for user:', employee.user_id)

    // Update user password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return new Response(
        JSON.stringify({ error: 'Error updating password', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark as first_login so user is forced to change password
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ first_login: true })
      .eq('id', employee.user_id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Password reset successfully to birth date',
        user_id: employee.user_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in reset-user-password function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
