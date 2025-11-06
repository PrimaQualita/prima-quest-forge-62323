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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar todos os documentos
    const { data: documents, error: docsError } = await supabase
      .from('compliance_documents')
      .select('*');

    if (docsError) throw docsError;

    console.log(`Processando ${documents.length} documentos...`);

    const systemPrompt = `Você é um especialista em criar questões de avaliação para documentos de compliance corporativo.
    
    Com base no conteúdo fornecido, gere EXATAMENTE 20 questões de múltipla escolha variadas e diversificadas.
    
    IMPORTANTE:
    - Cada questão deve ter 4 opções (A, B, C, D)
    - Apenas uma opção correta
    - Questões devem cobrir diferentes aspectos do documento
    - Misture questões fáceis, médias e difíceis
    - Questões devem testar compreensão prática do conteúdo
    - Varie os tópicos para evitar repetição
    
    Retorne as questões no seguinte formato JSON:
    {
      "questions": [
        {
          "question": "Texto da pergunta",
          "options": {
            "A": "Opção A",
            "B": "Opção B",
            "C": "Opção C",
            "D": "Opção D"
          },
          "correct_answer": "A"
        }
      ]
    }`;

    let totalGenerated = 0;
    const results = [];

    for (const doc of documents) {
      try {
        console.log(`Gerando questões para: ${doc.title}`);

        // Verificar se já tem questões
        const { data: existingQuestions } = await supabase
          .from('document_questions')
          .select('id')
          .eq('document_id', doc.id);

        if (existingQuestions && existingQuestions.length >= 20) {
          console.log(`Documento "${doc.title}" já possui ${existingQuestions.length} questões`);
          results.push({
            document: doc.title,
            status: 'skipped',
            reason: 'Já possui questões'
          });
          continue;
        }

        const contentToAnalyze = doc.content || `Título: ${doc.title}\nCategoria: ${doc.category}\nDescrição: ${doc.description || ''}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { 
                role: "user", 
                content: `Gere 20 questões variadas baseadas neste documento de compliance:\n\n${contentToAnalyze.substring(0, 50000)}` 
              }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "generate_questions",
                  description: "Gera questões de múltipla escolha baseadas no documento",
                  parameters: {
                    type: "object",
                    properties: {
                      questions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            question: { type: "string" },
                            options: {
                              type: "object",
                              properties: {
                                A: { type: "string" },
                                B: { type: "string" },
                                C: { type: "string" },
                                D: { type: "string" }
                              },
                              required: ["A", "B", "C", "D"]
                            },
                            correct_answer: { 
                              type: "string",
                              enum: ["A", "B", "C", "D"]
                            }
                          },
                          required: ["question", "options", "correct_answer"]
                        }
                      }
                    },
                    required: ["questions"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "generate_questions" } }
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Erro da IA para ${doc.title}:`, response.status, error);
          results.push({
            document: doc.title,
            status: 'error',
            error: `Erro da IA: ${response.status}`
          });
          continue;
        }

        const aiResponse = await response.json();
        const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
        
        if (!toolCall) {
          results.push({
            document: doc.title,
            status: 'error',
            error: 'IA não retornou questões'
          });
          continue;
        }

        const questionsData = JSON.parse(toolCall.function.arguments);
        
        if (!questionsData.questions || questionsData.questions.length < 20) {
          console.log(`IA gerou apenas ${questionsData.questions?.length || 0} questões para ${doc.title}`);
        }

        // Deletar questões antigas deste documento
        await supabase
          .from('document_questions')
          .delete()
          .eq('document_id', doc.id);

        // Inserir novas questões
        const questionsToInsert = questionsData.questions.map((q: any) => ({
          document_id: doc.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer
        }));

        const { data: insertedQuestions, error: insertError } = await supabase
          .from('document_questions')
          .insert(questionsToInsert)
          .select();

        if (insertError) {
          console.error(`Erro ao inserir questões para ${doc.title}:`, insertError);
          results.push({
            document: doc.title,
            status: 'error',
            error: insertError.message
          });
          continue;
        }

        totalGenerated += insertedQuestions.length;
        results.push({
          document: doc.title,
          status: 'success',
          questionsGenerated: insertedQuestions.length
        });

        console.log(`${insertedQuestions.length} questões geradas para ${doc.title}`);

      } catch (error) {
        console.error(`Erro ao processar ${doc.title}:`, error);
        results.push({
          document: doc.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        totalDocuments: documents.length,
        totalQuestionsGenerated: totalGenerated,
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
