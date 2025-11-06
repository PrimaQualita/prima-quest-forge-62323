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
    const { trainingId, documentContent } = await req.json();
    
    if (!trainingId || !documentContent) {
      return new Response(
        JSON.stringify({ error: 'trainingId e documentContent são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Gerando questões para training ${trainingId}`);
    console.log(`Tamanho do conteúdo: ${documentContent.length} caracteres`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis de ambiente não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validar conteúdo
    const words = documentContent.trim().split(/\s+/).length;
    if (words < 100) {
      return new Response(
        JSON.stringify({ error: 'O conteúdo é muito curto. Insira pelo menos 100 palavras.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓ Validação aprovada: ${words} palavras`);

    // Gerar questões usando Lovable AI
    const systemPrompt = `Você é um especialista em criar questões de avaliação para treinamentos corporativos.
    
    TAREFA OBRIGATÓRIA: Gere EXATAMENTE 50 questões de múltipla escolha. NUNCA retorne menos de 50 questões.
    
    Com base no CONTEÚDO REAL fornecido, você DEVE gerar 50 questões completas.
    
    IMPORTANTE - SOBRE O QUE PERGUNTAR:
    - Faça perguntas sobre o CONTEÚDO e INFORMAÇÕES apresentadas no texto
    - Pergunte sobre políticas, procedimentos, definições e conceitos mencionados
    - Teste a compreensão dos pontos principais e detalhes relevantes
    - Crie questões práticas sobre como aplicar as informações
    
    NUNCA faça perguntas sobre:
    - Metadados do documento (formato, estrutura, página)
    - Como o documento foi criado ou processado
    - Informações que não estão no conteúdo fornecido
    
    FORMATO DAS QUESTÕES:
    - Cada questão deve ter 4 alternativas (A, B, C, D)
    - Apenas uma alternativa correta
    - Questões devem testar compreensão e aplicação prática, não apenas memorização
    - Varie os tópicos e conceitos abordados para garantir cobertura completa
    
    CRÍTICO: Se o documento tiver menos conteúdo, repita conceitos-chave em diferentes formatos de pergunta para atingir 50 questões. NUNCA retorne um array vazio ou com menos de 50 questões.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Gere EXATAMENTE 50 questões baseadas neste conteúdo:\n\n${documentContent}` 
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_questions',
              description: 'Gera exatamente 50 questões de múltipla escolha',
              parameters: {
                type: 'object',
                properties: {
                  questions: {
                    type: 'array',
                    minItems: 50,
                    maxItems: 50,
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string', description: 'A pergunta' },
                        options: {
                          type: 'object',
                          properties: {
                            A: { type: 'string' },
                            B: { type: 'string' },
                            C: { type: 'string' },
                            D: { type: 'string' }
                          },
                          required: ['A', 'B', 'C', 'D']
                        },
                        correct_answer: { 
                          type: 'string', 
                          enum: ['A', 'B', 'C', 'D'],
                          description: 'A letra da resposta correta' 
                        }
                      },
                      required: ['question', 'options', 'correct_answer']
                    }
                  }
                },
                required: ['questions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API da IA:', aiResponse.status, errorText);
      throw new Error(`Erro na API da IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('Resposta da IA recebida');

    if (!aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      console.error('Estrutura da resposta inválida:', JSON.stringify(aiData));
      throw new Error('Nenhuma questão foi gerada pela IA');
    }

    const toolArgs = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    const questions = toolArgs.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('IA não retornou questões válidas');
      throw new Error('Nenhuma questão foi gerada pela IA');
    }

    console.log(`IA gerou ${questions.length} questões`);

    // Inserir questões no banco
    console.log(`Inserindo ${questions.length} questões no banco...`);
    
    const questionsToInsert = questions.map((q: any) => ({
      training_id: trainingId,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
    }));

    const { error: insertError } = await supabase
      .from('training_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Erro ao inserir questões:', insertError);
      throw insertError;
    }

    console.log(`${questions.length} questões inseridas com sucesso`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        questionsGenerated: questions.length,
        message: `${questions.length} questões geradas com sucesso!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao gerar questões:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
