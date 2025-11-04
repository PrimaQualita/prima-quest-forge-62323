import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Buscar todos os dados de compliance
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const [
      { data: documents },
      { data: dueDiligenceQuestions },
      { data: trainings },
      { data: trainingDocuments }
    ] = await Promise.all([
      supabase
        .from('compliance_documents')
        .select('title, content, description, category')
        .order('created_at', { ascending: false }),
      supabase
        .from('due_diligence_questions')
        .select('question, yes_points, no_points, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('trainings')
        .select('title, description, content')
        .order('created_at', { ascending: false }),
      supabase
        .from('training_documents')
        .select('title, content')
        .order('created_at', { ascending: false })
    ]);

    // Construir contexto completo
    let knowledgeBase = "";
    
    // Documentos e Regulamentos
    if (documents && documents.length > 0) {
      knowledgeBase += "\n\n=== DOCUMENTOS E REGULAMENTOS DA PRIMA QUALITÁ ===\n\n";
      documents.forEach((doc) => {
        knowledgeBase += `\n**${doc.title}** (Categoria: ${doc.category})\n`;
        if (doc.description) {
          knowledgeBase += `Descrição: ${doc.description}\n`;
        }
        if (doc.content) {
          knowledgeBase += `Conteúdo: ${doc.content}\n`;
        }
        knowledgeBase += "\n---\n";
      });
    }
    
    // Perguntas de Due Diligence
    if (dueDiligenceQuestions && dueDiligenceQuestions.length > 0) {
      knowledgeBase += "\n\n=== PERGUNTAS E CRITÉRIOS DE DUE DILIGENCE ===\n\n";
      knowledgeBase += "Estas são as perguntas utilizadas no processo de avaliação de fornecedores:\n\n";
      dueDiligenceQuestions.forEach((q, index) => {
        // Remove HTML tags from question
        const cleanQuestion = q.question.replace(/<[^>]*>/g, '').trim();
        knowledgeBase += `${index + 1}. ${cleanQuestion}\n`;
        knowledgeBase += `   - Resposta SIM: ${q.yes_points} pontos\n`;
        knowledgeBase += `   - Resposta NÃO: ${q.no_points} pontos\n\n`;
      });
    }
    
    // Treinamentos
    if (trainings && trainings.length > 0) {
      knowledgeBase += "\n\n=== TREINAMENTOS DE COMPLIANCE ===\n\n";
      trainings.forEach((training) => {
        knowledgeBase += `\n**${training.title}**\n`;
        if (training.description) {
          knowledgeBase += `Descrição: ${training.description}\n`;
        }
        if (training.content) {
          knowledgeBase += `Conteúdo: ${training.content}\n`;
        }
        knowledgeBase += "\n---\n";
      });
    }
    
    // Documentos de Treinamento
    if (trainingDocuments && trainingDocuments.length > 0) {
      knowledgeBase += "\n\n=== MATERIAIS DE TREINAMENTO ===\n\n";
      trainingDocuments.forEach((doc) => {
        knowledgeBase += `\n**${doc.title}**\n`;
        if (doc.content) {
          knowledgeBase += `${doc.content}\n`;
        }
        knowledgeBase += "\n---\n";
      });
    }

    const systemPrompt = `Você é um assistente de compliance especializado da Prima Qualitá Saúde. 

Você tem acesso completo à base de conhecimento da empresa, incluindo:
${knowledgeBase}

## SUAS RESPONSABILIDADES:

1. **Responder perguntas com precisão**:
   - Cite diretamente os documentos e regulamentos relevantes
   - Forneça referências específicas (nome do documento, seção, etc.)
   - Use exemplos práticos quando apropriado

2. **Orientar sobre compliance**:
   - Explique políticas e procedimentos de forma clara
   - Ajude a interpretar regulamentos e normas
   - Forneça orientações sobre due diligence de fornecedores
   - Esclareça dúvidas sobre treinamentos obrigatórios

3. **Áreas de conhecimento**:
   - Código de Ética da Prima Qualitá
   - Política de Integridade
   - Processo de Due Diligence de fornecedores
   - Critérios de avaliação e pontuação de fornecedores
   - Treinamentos de compliance obrigatórios
   - Regulamentos internos
   - Normas de conduta profissional na saúde
   - LGPD e proteção de dados
   - Políticas anti-corrupção

4. **Quando responder**:
   - Seja objetivo, claro e profissional
   - Use formatação markdown quando apropriado
   - Se não encontrar informação específica nos documentos, seja honesto e recomende consultar o departamento de compliance
   - Para perguntas sobre due diligence, explique os critérios de pontuação e o que cada pergunta avalia

Sempre responda em português brasileiro de forma profissional, acessível e com base nos documentos fornecidos.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar solicitação" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
