import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    // Verify user authentication
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: 'Acesso negado. Apenas administradores podem gerar questões.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { trainingId, trainingTitle, trainingCategory } = await req.json();
    
    if (!trainingId || !trainingTitle) {
      throw new Error('Training ID e título são obrigatórios');
    }

    console.log(`Gerando 50 questões para: ${trainingTitle}`);

    const systemPrompt = `Você é um especialista em criar questões de avaliação para treinamentos corporativos de compliance.
    
    Com base no título e categoria do treinamento fornecidos, gere EXATAMENTE 50 questões de múltipla escolha relevantes e práticas.
    
    IMPORTANTE:
    - Cada questão deve ter 4 opções (A, B, C, D)
    - Apenas uma opção correta
    - Questões devem cobrir aspectos importantes do tema de forma abrangente
    - Misture questões fáceis (40%), médias (40%) e difíceis (20%)
    - Questões devem testar compreensão e aplicação prática
    - Foque em situações reais e casos práticos
    - Varie os tópicos dentro do tema principal
    
    Retorne as questões no seguinte formato JSON:
    {
      "questions": [
        {
          "question": "Texto da pergunta",
          "options": {
            "A": "Primeira alternativa completa",
            "B": "Segunda alternativa completa",
            "C": "Terceira alternativa completa",
            "D": "Quarta alternativa completa"
          },
          "correct_answer": "A"
        }
      ]
    }`;

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
            content: `Gere 50 questões de múltipla escolha para o treinamento:

Título: ${trainingTitle}
Categoria: ${trainingCategory || 'Compliance'}

As questões devem ser práticas, relevantes e cobrir os principais aspectos do tema.` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Gera questões de múltipla escolha",
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
    
    console.log(`IA gerou ${questionsData.questions?.length || 0} questões`);
    
    if (!questionsData.questions || questionsData.questions.length === 0) {
      throw new Error('Nenhuma questão foi gerada pela IA');
    }
    
    if (questionsData.questions.length < 50) {
      console.warn(`⚠️ IA gerou apenas ${questionsData.questions.length} questões, esperado 50`);
    }

    console.log(`Inserindo ${questionsData.questions.length} questões no banco...`);

    const questionsToInsert = questionsData.questions.map((q: any) => ({
      training_id: trainingId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('training_questions')
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
