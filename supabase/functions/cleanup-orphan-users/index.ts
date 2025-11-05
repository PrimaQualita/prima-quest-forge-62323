import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Buscando usuários órfãos...');

    // Buscar todos os users do auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    // Buscar todos os employees com user_id
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('user_id');
    
    if (employeesError) throw employeesError;

    const linkedUserIds = new Set(employees?.map(e => e.user_id).filter(Boolean) || []);
    
    // Encontrar usuários órfãos (existem no auth mas não em employees)
    const orphanUsers = users?.filter(u => !linkedUserIds.has(u.id)) || [];

    console.log(`Encontrados ${orphanUsers.length} usuário(s) órfão(s)`);

    const deletedUsers: string[] = [];
    const errors: string[] = [];

    // Deletar usuários órfãos
    for (const user of orphanUsers) {
      try {
        console.log(`Deletando usuário órfão: ${user.email} (${user.id})`);
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`Erro ao deletar ${user.email}:`, error);
          errors.push(`${user.email}: ${error.message}`);
        } else {
          deletedUsers.push(user.email || user.id);
        }
      } catch (err) {
        console.error(`Exceção ao deletar ${user.email}:`, err);
        errors.push(`${user.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Limpeza concluída. ${deletedUsers.length} deletado(s), ${errors.length} erro(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedUsers,
        errors: errors.length > 0 ? errors : undefined,
        total: orphanUsers.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na limpeza:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
