import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Usar service role para ter permissões completas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { employeeIds } = await req.json() as { employeeIds: string[] };

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'IDs de colaboradores são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deletando ${employeeIds.length} colaborador(es)...`);

    const deletionErrors: string[] = [];

    // 1. Deletar progresso de vídeos
    console.log('Deletando progresso de vídeos...');
    const { error: videoProgressError } = await supabase
      .from('video_progress')
      .delete()
      .in('employee_id', employeeIds);
    
    if (videoProgressError) {
      console.error('Erro ao deletar progresso de vídeos:', videoProgressError);
      deletionErrors.push(`Video progress: ${videoProgressError.message}`);
    }

    // 2. Deletar participações em treinamentos
    console.log('Deletando participações em treinamentos...');
    const { error: participationsError } = await supabase
      .from('training_participations')
      .delete()
      .in('employee_id', employeeIds);
    
    if (participationsError) {
      console.error('Erro ao deletar participações:', participationsError);
      deletionErrors.push(`Participations: ${participationsError.message}`);
    }

    // 3. Deletar avaliações de treinamento
    console.log('Deletando avaliações de treinamento...');
    const { error: assessmentsError } = await supabase
      .from('training_assessments')
      .delete()
      .in('employee_id', employeeIds);
    
    if (assessmentsError) {
      console.error('Erro ao deletar avaliações:', assessmentsError);
      deletionErrors.push(`Assessments: ${assessmentsError.message}`);
    }

    // 4. Deletar reconhecimentos de documentos
    console.log('Deletando reconhecimentos de documentos...');
    const { error: acknowledgementsError } = await supabase
      .from('document_acknowledgments')
      .delete()
      .in('employee_id', employeeIds);
    
    if (acknowledgementsError) {
      console.error('Erro ao deletar reconhecimentos:', acknowledgementsError);
      deletionErrors.push(`Acknowledgments: ${acknowledgementsError.message}`);
    }

    // 5. Deletar mensagens e conversas de chat
    console.log('Buscando conversas de chat...');
    const { data: conversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .in('employee_id', employeeIds);
    
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      
      console.log(`Deletando mensagens de ${conversationIds.length} conversa(s)...`);
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('conversation_id', conversationIds);
      
      if (messagesError) {
        console.error('Erro ao deletar mensagens:', messagesError);
        deletionErrors.push(`Messages: ${messagesError.message}`);
      }
    }

    console.log('Deletando conversas de chat...');
    const { error: conversationsError } = await supabase
      .from('chat_conversations')
      .delete()
      .in('employee_id', employeeIds);
    
    if (conversationsError) {
      console.error('Erro ao deletar conversas:', conversationsError);
      deletionErrors.push(`Conversations: ${conversationsError.message}`);
    }

    // 6. Buscar user_ids dos colaboradores
    console.log('Buscando user_ids dos colaboradores...');
    const { data: employeesData } = await supabase
      .from('employees')
      .select('user_id, name')
      .in('id', employeeIds);
    
    const userIds = employeesData
      ?.map(e => e.user_id)
      .filter(id => id !== null) || [];

    console.log(`Encontrados ${userIds.length} usuário(s) vinculado(s)`);

    // 7. Deletar roles de usuários
    if (userIds.length > 0) {
      console.log('Deletando roles de usuários...');
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .in('user_id', userIds);
      
      if (rolesError) {
        console.error('Erro ao deletar roles:', rolesError);
        deletionErrors.push(`Roles: ${rolesError.message}`);
      }
    }

    // 8. Deletar perfis de usuários
    if (userIds.length > 0) {
      console.log('Deletando perfis de usuários...');
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Erro ao deletar perfis:', profilesError);
        deletionErrors.push(`Profiles: ${profilesError.message}`);
      }
    }

    // 9. Deletar colaboradores
    console.log('Deletando colaboradores...');
    const { error: employeesError } = await supabase
      .from('employees')
      .delete()
      .in('id', employeeIds);

    if (employeesError) {
      console.error('ERRO CRÍTICO ao deletar colaboradores:', employeesError);
      throw new Error(`Falha ao deletar colaboradores: ${employeesError.message}`);
    }

    // 10. Deletar usuários do auth
    if (userIds.length > 0) {
      console.log('Deletando usuários do auth...');
      for (const userId of userIds) {
        try {
          const { error: authError } = await supabase.auth.admin.deleteUser(userId);
          if (authError) {
            console.error(`Erro ao deletar usuário ${userId}:`, authError);
            deletionErrors.push(`Auth user ${userId}: ${authError.message}`);
          }
        } catch (err) {
          console.error(`Exceção ao deletar usuário ${userId}:`, err);
          deletionErrors.push(`Auth user ${userId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    console.log(`Exclusão concluída. ${deletionErrors.length} erro(s) não crítico(s).`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deleted: employeeIds.length,
        warnings: deletionErrors.length > 0 ? deletionErrors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na exclusão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
