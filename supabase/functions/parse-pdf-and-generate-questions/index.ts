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
    
    // Identificar tipo de arquivo
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
    const isDocx = fileExtension === 'docx' || fileExtension === 'doc';
    const isPdf = fileExtension === 'pdf';
    
    console.log(`Processando arquivo: ${filePath} (tipo: ${fileExtension})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Credenciais do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Baixando arquivo do storage...');
    
    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('compliance-documents')
      .download(filePath);

    if (downloadError) {
      console.error('Erro ao baixar arquivo:', downloadError);
      throw downloadError;
    }
    
    if (!fileData) {
      throw new Error('Arquivo não encontrado no storage');
    }
    
    console.log(`✓ Arquivo baixado com sucesso (${fileData.size} bytes)`);

    console.log('Extraindo texto do documento...');
    
    // Verificar tamanho do arquivo
    const arrayBuffer = await fileData.arrayBuffer();
    const fileSizeInMB = arrayBuffer.byteLength / (1024 * 1024);
    console.log(`Tamanho do arquivo: ${fileSizeInMB.toFixed(2)} MB`);
    
    // Limitar processamento de arquivos muito grandes
    if (fileSizeInMB > 10) {
      throw new Error(`Arquivo muito grande (${fileSizeInMB.toFixed(2)}MB). Máximo permitido: 10MB`);
    }
    
    // Converter para base64 de forma mais eficiente
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64Doc = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64Doc += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    
    console.log(`Documento convertido para base64, tamanho: ${base64Doc.length} caracteres`);
    
    // Preparar mensagem baseada no tipo de arquivo
    const extractionPrompt = isDocx 
      ? `Este é um arquivo Microsoft Word (.docx) codificado em base64. 

TAREFA CRÍTICA:
1. Decodifique o arquivo DOCX
2. Extraia TODO O TEXTO visível do documento
3. Retorne APENAS o texto puro, sem análises, sem descrições, sem metadados
4. Mantenha parágrafos, títulos, listas e estrutura do texto
5. NÃO mencione que é um arquivo DOCX, base64, ou qualquer aspecto técnico
6. Imagine que está copiando e colando todo o texto visível do Word

O texto extraído será usado para criar questões de avaliação sobre o CONTEÚDO.

Arquivo base64:
${base64Doc}`
      : `Este é um documento PDF codificado em base64.

Extraia TODO O TEXTO do documento de forma clara e estruturada.
Mantenha títulos, seções e parágrafos.
Retorne apenas o texto, sem análises ou descrições.

Arquivo base64:
${base64Doc}`;
    
    const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { 
            role: "user", 
            content: extractionPrompt
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
    
    console.log('Resposta da IA de extração:', JSON.stringify(extractData).substring(0, 500));
    
    if (!extractData.choices || !extractData.choices[0] || !extractData.choices[0].message) {
      console.error('Estrutura de resposta inválida:', JSON.stringify(extractData));
      throw new Error('Erro ao extrair texto: resposta inválida da IA');
    }
    
    const documentContent = extractData.choices[0].message.content;
    
    if (!documentContent) {
      console.error('Nenhum conteúdo retornado pela IA');
      throw new Error('Erro ao extrair texto: IA não retornou conteúdo');
    }
    
    console.log('Texto extraído com sucesso');
    console.log('Tamanho do conteúdo:', documentContent.length, 'caracteres');
    console.log('Preview completo do conteúdo extraído:');
    console.log('=====================================');
    console.log(documentContent.substring(0, 1000));
    console.log('=====================================');
    
    // Validações rigorosas de conteúdo
    if (!documentContent || documentContent.length < 200) {
      console.error('❌ ERRO: Conteúdo muito curto:', documentContent);
      throw new Error(`Falha na extração de texto. Extraído apenas ${documentContent?.length || 0} caracteres. 
      
Isso pode acontecer se:
1. O arquivo está corrompido
2. O arquivo não contém texto extraível
3. O arquivo é uma imagem escaneada (tente usar OCR primeiro)

Por favor, verifique o arquivo e tente novamente.`);
    }
    
    const contentLower = documentContent.toLowerCase();
    
    // Rejeitar se contém muitas menções técnicas que indicam metadados ao invés de conteúdo
    const technicalTerms = [
      'base64', 'pdf document converted', 'xml', 'content_types', 'document.xml',
      'rels', 'footer1.xml', 'header1.xml', 'this is a pdf', 'this document appears',
      'the content appears to be', 'structure and internal', 'microsoft word documents (.docx)'
    ];
    
    const technicalTermCount = technicalTerms.filter(term => contentLower.includes(term)).length;
    
    if (technicalTermCount >= 3) {
      console.error('Conteúdo extraído contém metadados técnicos:', documentContent.substring(0, 500));
      throw new Error('Erro na extração: IA retornou metadados técnicos ao invés do conteúdo real. Tente novamente ou use outro formato de documento.');
    }
    
    // Rejeitar se for JSON estruturado (indica análise ao invés de texto puro)
    if (contentLower.trim().startsWith('{') || contentLower.trim().startsWith('```json')) {
      console.error('Conteúdo extraído é JSON estruturado:', documentContent.substring(0, 300));
      throw new Error('Erro na extração: IA retornou estrutura JSON ao invés do texto. Por favor, tente novamente.');
    }
    
    // Validar que tem conteúdo substantivo (não apenas lista de arquivos)
    const words = documentContent.split(/\s+/).filter((w: string) => w.length > 3);
    if (words.length < 50) {
      throw new Error('Documento não contém texto suficiente. Mínimo: 50 palavras significativas.');
    }
    
    console.log(`✓ Validação aprovada: ${words.length} palavras, ${documentContent.length} caracteres`);

    const systemPrompt = `Você é um especialista em criar questões de avaliação para treinamentos corporativos.
    
    TAREFA OBRIGATÓRIA: Gere EXATAMENTE 50 questões de múltipla escolha. NUNCA retorne menos de 50 questões.
    
    Com base no CONTEÚDO REAL do documento fornecido, você DEVE gerar 50 questões completas.
    
    IMPORTANTE - SOBRE O QUE PERGUNTAR:
    - Faça perguntas sobre o CONTEÚDO e INFORMAÇÕES apresentadas no documento
    - Pergunte sobre conceitos, procedimentos, normas, diretrizes mencionadas no texto
    - NÃO pergunte sobre formato de arquivo, estrutura técnica, conversão, ou metadados
    - NÃO mencione "PDF", "base64", "documento", "texto", "formato" nas questões
    - Foque no TEMA e ASSUNTO que o documento aborda
    
    ESTRUTURA DAS QUESTÕES:
    - Cada questão deve ter 4 opções (A, B, C, D)
    - Apenas uma opção correta
    - Questões devem cobrir TODO o conteúdo do documento de forma abrangente
    - Misture questões fáceis (40%), médias (40%) e difíceis (20%)
    - Questões devem testar compreensão e aplicação prática, não apenas memorização
    - Varie os tópicos e conceitos abordados para garantir cobertura completa
    
    CRÍTICO: Se o documento tiver menos conteúdo, repita conceitos-chave em diferentes formatos de pergunta para atingir 50 questões. NUNCA retorne um array vazio ou com menos de 50 questões.
    
    EXEMPLO DE QUESTÕES CORRETAS (supondo um documento sobre LGPD):
    ✓ "Qual o prazo máximo para resposta a uma solicitação de titular de dados?"
    ✓ "Em qual situação é permitido o tratamento de dados sensíveis?"
    
    EXEMPLO DE QUESTÕES ERRADAS:
    ✗ "Qual o formato do arquivo que contém este documento?"
    ✗ "Como o documento foi convertido para processamento?"
    
    Retorne SEMPRE um objeto JSON com EXATAMENTE 50 questões no seguinte formato:
    {
      "questions": [
        {
          "question": "Pergunta sobre o CONTEÚDO e TEMA do documento",
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
            content: `Gere EXATAMENTE 50 questões baseadas neste documento:\n\n${documentContent}` 
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