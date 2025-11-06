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
    const { trainingId, filePath } = await req.json();
    
    if (!trainingId || !filePath) {
      throw new Error('Training ID e caminho do arquivo são obrigatórios');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Baixando arquivo PDF do storage...');
    
    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('compliance-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Erro ao baixar arquivo:', downloadError);
      throw downloadError;
    }

    console.log('Extraindo texto do PDF...');
    
    // Verificar tamanho do arquivo
    const arrayBuffer = await fileData.arrayBuffer();
    const fileSizeInMB = arrayBuffer.byteLength / (1024 * 1024);
    console.log(`Tamanho do arquivo: ${fileSizeInMB.toFixed(2)} MB`);
    
    // Limitar processamento de arquivos muito grandes
    if (fileSizeInMB > 5) {
      throw new Error(`Arquivo muito grande (${fileSizeInMB.toFixed(2)}MB). Máximo permitido: 5MB`);
    }
    
    // Converter para base64 de forma mais eficiente
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64Pdf = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64Pdf += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    
    console.log(`PDF convertido para base64, tamanho: ${base64Pdf.length} caracteres`);
    
    // Limitar tamanho do base64 enviado (800KB = ~600KB de PDF)
    const maxBase64Length = 800000;
    const base64ToSend = base64Pdf.length > maxBase64Length 
      ? base64Pdf.substring(0, maxBase64Length) 
      : base64Pdf;
    
    console.log(`Enviando ${base64ToSend.length} caracteres (${Math.round(base64ToSend.length / 1000)}KB) para extração`);
    
    const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { 
            role: "system",
            content: "Extraia TODO o texto deste PDF de forma estruturada. Mantenha títulos, seções e parágrafos organizados."
          },
          { 
            role: "user", 
            content: `Documento PDF em base64:\n${base64ToSend}`
          }
        ]
      }),
    });

    if (!extractResponse.ok) {
      const error = await extractResponse.text();
      console.error("Erro ao extrair texto:", extractResponse.status, error);
      
      if (extractResponse.status === 429) {
        throw new Error("Limite de requisições atingido. Aguarde alguns minutos e tente novamente.");
      }
      if (extractResponse.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.");
      }
      
      throw new Error(`Erro ao extrair texto do PDF: ${extractResponse.status}`);
    }

    const extractData = await extractResponse.json();
    const documentContent = extractData.choices[0].message.content;
    
    console.log('Texto extraído com sucesso');
    console.log('Tamanho do conteúdo:', documentContent.length, 'caracteres');
    console.log('Preview do conteúdo:', documentContent.substring(0, 300));
    
    // Validar conteúdo extraído
    if (!documentContent || documentContent.length < 100) {
      throw new Error('PDF não contém texto suficiente para gerar questões. Verifique se o arquivo está correto.');
    }
    
    if (documentContent.toLowerCase().includes('log de atividades') || 
        documentContent.toLowerCase().includes('conjunto de dados')) {
      throw new Error('PDF parece conter apenas dados brutos. Use um documento com texto formatado.');
    }

    const systemPrompt = `Você é um especialista em criar questões de avaliação para treinamentos corporativos.
    
    Com base no conteúdo do documento fornecido, gere EXATAMENTE 50 questões de múltipla escolha.
    
    IMPORTANTE:
    - Cada questão deve ter 4 opções (A, B, C, D)
    - Apenas uma opção correta
    - Questões devem cobrir TODO o conteúdo do documento de forma abrangente
    - Misture questões fáceis (40%), médias (40%) e difíceis (20%)
    - Questões devem testar compreensão e aplicação prática, não apenas memorização
    - As questões devem ser sobre o CONTEÚDO real do documento, não sobre metadados ou estrutura técnica
    - Varie os tópicos e conceitos abordados para garantir cobertura completa
    
    Retorne as questões no seguinte formato JSON:
    {
      "questions": [
        {
          "question": "Texto da pergunta sobre o conteúdo do documento",
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
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Gere 50 questões baseadas neste documento:\n\n${documentContent}` 
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
      console.error("Erro da IA ao gerar questões:", response.status, error);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições atingido. Aguarde alguns minutos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes para gerar questões.");
      }
      
      throw new Error(`Erro ao gerar questões: ${response.status} - ${error.substring(0, 200)}`);
    }

    const aiResponse = await response.json();
    console.log('Resposta da IA recebida');
    console.log('Estrutura da resposta:', JSON.stringify(aiResponse).substring(0, 500));
    
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('Resposta completa da IA:', JSON.stringify(aiResponse, null, 2));
      throw new Error("IA não retornou questões no formato esperado. Verifique os logs para detalhes.");
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

    // Inserir questões no banco
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
        questionsGenerated: insertedQuestions.length,
        contentPreview: documentContent.substring(0, 200)
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