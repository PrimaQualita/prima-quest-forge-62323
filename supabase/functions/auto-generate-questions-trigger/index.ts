import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json();
    
    console.log('Trigger acionado para novo documento:', record);
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verificar se já existem questões para este treinamento
    const { data: existingQuestions } = await supabase
      .from('training_questions')
      .select('id')
      .eq('training_id', record.training_id)
      .limit(1);
    
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Treinamento já possui questões, pulando geração');
      return new Response(
        JSON.stringify({ success: true, message: 'Questões já existem' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Invocar a função de geração de questões
    console.log('Gerando questões para training_id:', record.training_id);
    
    const { data, error } = await supabase.functions.invoke('parse-pdf-and-generate-questions', {
      body: {
        trainingId: record.training_id,
        filePath: record.file_path
      }
    });
    
    if (error) {
      console.error('Erro ao gerar questões:', error);
      throw error;
    }
    
    console.log('Questões geradas com sucesso:', data);
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no trigger:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
