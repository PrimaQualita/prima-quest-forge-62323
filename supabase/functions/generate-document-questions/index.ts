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
    const { documentId, documentContent, documentTitle, documentCategory } = await req.json();
    
    if (!documentId) {
      throw new Error('ID do documento é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    console.log('Gerando 20 questões com IA para documento:', documentTitle);

    const contentToAnalyze = documentContent || `Título: ${documentTitle}\nCategoria: ${documentCategory}`;

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
            content: `Gere 20 questões variadas baseadas neste documento:\n\n${contentToAnalyze.substring(0, 50000)}` 
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
      console.error("Erro da IA:", response.status, error);
      throw new Error(`Erro ao gerar questões: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Resposta da IA recebida');
    
    const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("IA não retornou questões no formato esperado");
    }

    const questionsData = JSON.parse(toolCall.function.arguments);
    
    if (!questionsData.questions || questionsData.questions.length < 20) {
      console.log(`IA gerou apenas ${questionsData.questions?.length || 0} questões, esperado 20`);
    }

    console.log(`Inserindo ${questionsData.questions.length} questões no banco...`);

    // Deletar questões antigas deste documento
    const { error: deleteError } = await supabase
      .from('document_questions')
      .delete()
      .eq('document_id', documentId);

    if (deleteError) {
      console.error("Erro ao deletar questões antigas:", deleteError);
    }

    // Inserir novas questões
    const questionsToInsert = questionsData.questions.map((q: any) => ({
      document_id: documentId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('document_questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Erro ao inserir questões:", insertError);
      throw insertError;
    }

    console.log(`${insertedQuestions.length} questões inseridas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsGenerated: insertedQuestions.length 
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
