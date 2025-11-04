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

    // Buscar documentos de compliance
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: documents, error: docsError } = await supabase
      .from('compliance_documents')
      .select('title, content, description, category')
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
    }

    // Construir contexto com os documentos
    let documentsContext = "";
    if (documents && documents.length > 0) {
      documentsContext = "\n\n=== DOCUMENTOS E REGULAMENTOS DA PRIMA QUALITÁ ===\n\n";
      documents.forEach((doc) => {
        documentsContext += `\n**${doc.title}** (Categoria: ${doc.category})\n`;
        if (doc.description) {
          documentsContext += `Descrição: ${doc.description}\n`;
        }
        if (doc.content) {
          documentsContext += `Conteúdo: ${doc.content}\n`;
        }
        documentsContext += "\n---\n";
      });
    }

    const systemPrompt = `Você é um assistente de compliance especializado nos regulamentos da Prima Qualitá Saúde. 

Você tem acesso aos seguintes documentos e regulamentos da empresa:
${documentsContext}

Com base nestes documentos, você deve:
- Responder perguntas citando diretamente os documentos relevantes
- Fornecer orientações baseadas nas políticas e regulamentos da empresa
- Ser objetivo, claro e sempre citar as bases regulamentares
- Se não encontrar informação específica nos documentos fornecidos, seja honesto e recomende consultar o departamento de compliance

Principais áreas de conhecimento:
- Código de Ética da empresa
- Política de Integridade
- Regulamentos internos de compliance
- Normas de conduta profissional na área da saúde
- LGPD e proteção de dados
- Políticas anti-corrupção

Sempre responda em português brasileiro de forma profissional e acessível.`;

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
