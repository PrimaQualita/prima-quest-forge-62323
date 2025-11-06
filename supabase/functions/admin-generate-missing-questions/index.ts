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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Buscando treinamentos sem questões...');
    
    // Buscar treinamentos que têm documentos mas não têm questões
    const { data: trainingsWithDocs, error: fetchError } = await supabase
      .from('trainings')
      .select(`
        id,
        title,
        category
      `);
    
    if (fetchError) throw fetchError;
    
    console.log(`Encontrados ${trainingsWithDocs?.length || 0} treinamentos`);
    
    const results = [];
    
    for (const training of trainingsWithDocs || []) {
      try {
        // Verificar se já tem questões
        const { data: existingQuestions } = await supabase
          .from('training_questions')
          .select('id')
          .eq('training_id', training.id)
          .limit(1);
        
        if (existingQuestions && existingQuestions.length > 0) {
          console.log(`✓ Treinamento "${training.title}" já possui questões`);
          results.push({
            training_id: training.id,
            title: training.title,
            success: true,
            message: 'Já possui questões',
            questionsGenerated: 0
          });
          continue;
        }
        
        console.log(`Gerando questões genéricas para: ${training.title}`);
        
        const { data, error } = await supabase.functions.invoke('generate-generic-questions', {
          body: {
            trainingId: training.id,
            trainingTitle: training.title,
            trainingCategory: training.category
          }
        });
        
        if (error) {
          console.error(`✗ Erro: ${training.title}`, error);
          results.push({
            training_id: training.id,
            title: training.title,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✓ Sucesso: ${training.title} - ${data?.questionsGenerated || 0} questões`);
          results.push({
            training_id: training.id,
            title: training.title,
            success: true,
            questionsGenerated: data?.questionsGenerated || 0
          });
        }
        
        // Aguardar 2 segundos entre cada chamada
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        console.error(`✗ Erro: ${training.title}`, err);
        results.push({
          training_id: training.id,
          title: training.title,
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.success && r.questionsGenerated > 0).length,
      skipped: results.filter(r => r.success && r.questionsGenerated === 0).length,
      failures: results.filter(r => !r.success).length
    };
    
    console.log('Resumo:', summary);
    
    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
