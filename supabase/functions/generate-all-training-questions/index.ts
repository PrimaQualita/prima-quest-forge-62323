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

    console.log('Buscando treinamentos com documentos...');

    // Fetch all trainings with documents
    const { data: trainings, error: fetchError } = await supabase
      .from('trainings')
      .select(`
        id,
        title,
        training_documents (
          id,
          file_path,
          file_name
        )
      `)
      .not('training_documents', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`Encontrados ${trainings?.length || 0} treinamentos`);

    const results = [];

    for (const training of trainings || []) {
      if (!training.training_documents || training.training_documents.length === 0) {
        continue;
      }

      // Take first document for each training
      const doc = training.training_documents[0];
      
      console.log(`Gerando questões para: ${training.title}`);

      try {
        // Call parse-pdf-and-generate-questions for each training
        const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-pdf-and-generate-questions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trainingId: training.id,
            filePath: doc.file_path
          })
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            trainingId: training.id,
            trainingTitle: training.title,
            success: true,
            questionsGenerated: data.questionsGenerated || 0
          });
          console.log(`✓ Sucesso: ${training.title} - ${data.questionsGenerated} questões`);
        } else {
          const error = await response.text();
          results.push({
            trainingId: training.id,
            trainingTitle: training.title,
            success: false,
            error: error
          });
          console.error(`✗ Erro: ${training.title} - ${error}`);
        }
      } catch (error) {
        results.push({
          trainingId: training.id,
          trainingTitle: training.title,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        console.error(`✗ Exceção: ${training.title} - ${error}`);
      }

      // Wait 2 seconds between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\nResumo: ${successCount} sucessos, ${failureCount} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failures: failureCount
        },
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
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