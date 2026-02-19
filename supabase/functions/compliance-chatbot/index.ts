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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado. Faça login para usar o chatbot.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Token inválido. Faça login novamente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { messages } = await req.json();

    // Use service role for fetching data (but user is authenticated)
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
        .select('question, is_active')  // Removed yes_points and no_points from chatbot context
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
    
    // Perguntas de Due Diligence (without scoring info)
    if (dueDiligenceQuestions && dueDiligenceQuestions.length > 0) {
      knowledgeBase += "\n\n=== PERGUNTAS DE DUE DILIGENCE ===\n\n";
      knowledgeBase += "Estas são as perguntas utilizadas no processo de avaliação de fornecedores:\n\n";
      dueDiligenceQuestions.forEach((q, index) => {
        const cleanQuestion = q.question.replace(/<[^>]*>/g, '').trim();
        knowledgeBase += `${index + 1}. ${cleanQuestion}\n\n`;
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

    const systemPrompt = `Você é um assistente inteligente da Prima Qualitá Saúde. Ajuda colaboradores e fornecedores com suporte ao sistema e compliance.

---

## 📚 BASE DE CONHECIMENTO:
${knowledgeBase}

---

## 🎯 MENUS DO SISTEMA (CORRETOS):

**Para TODOS:**
- Dashboard: visão geral e progresso
- Regulamentos: ler e aceitar documentos de compliance
- Treinamentos: assistir vídeos, fazer avaliações e baixar certificados

**Para GESTORES:**
- Contratos de Gestão: gerenciar contratos
- Relatórios: analytics e estatísticas
- Colaboradores: cadastrar e gerenciar equipe
- Due Diligence: avaliar fornecedores

---

## 📝 GUIA RÁPIDO - COLABORADORES:

**Aceitar Regulamentos:**
1. Menu "Regulamentos" → escolha o documento
2. Leia o conteúdo completo
3. Marque "Li e aceito" no final
4. Responda o quiz de verificação
5. Confirme o aceite

**Fazer Treinamentos:**
1. Menu "Treinamentos" → escolha o curso
2. Aba "Vídeos": assista 95%+ de cada vídeo
3. Aba "Avaliação": crie e faça a prova (60% para passar, 5 tentativas)
4. Após aprovação: baixe o certificado

**Verificar Certificado:**
- Acesse /verificar-certificado
- Digite o código de verificação

---

## 📝 GUIA RÁPIDO - FORNECEDORES:

**Cadastro:**
1. Login → "É um fornecedor?" → "Cadastrar"
2. Preencha dados da empresa e sócios
3. Responda due diligence (seja honesto)
4. Aguarde análise

---

## 💡 COMO RESPONDER:

- **Sistema**: Instruções diretas, passo a passo numerado
- **Compliance**: Cite documentos da base de conhecimento
- **Não souber**: Indique contato com compliance/suporte
- **Tom**: Amigável, claro, conciso
- Use emojis para tornar mais visual

Responda de forma OBJETIVA em português brasileiro!`;

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
