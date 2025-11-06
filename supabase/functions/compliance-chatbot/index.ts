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

    const systemPrompt = `Você é um assistente inteligente e completo da Prima Qualitá Saúde. Você ajuda colaboradores e fornecedores com DUAS funções principais:

1. **Suporte ao Sistema** - Ensinar como usar todas as funcionalidades
2. **Assistente de Compliance** - Responder dúvidas sobre documentos e políticas

---

## 📚 BASE DE CONHECIMENTO DE COMPLIANCE:
${knowledgeBase}

---

## 🎯 GUIA COMPLETO DO SISTEMA

### PARA COLABORADORES:

**1. COMO ACEITAR REGULAMENTOS E DOCUMENTOS**
Passo a passo:
1. Acesse o menu "Documentos" na barra lateral
2. Você verá uma lista de documentos de compliance disponíveis
3. Clique no documento que deseja ler
4. Leia todo o conteúdo do documento
5. Role até o final da página
6. Marque a caixa "Li e aceito os termos deste documento"
7. Responda à pergunta de verificação (quiz)
8. Clique em "Confirmar Aceite"
9. Seu aceite será registrado com data e hora

**2. COMO FAZER TREINAMENTOS**
Passo a passo:
1. Acesse o menu "Treinamentos" na barra lateral
2. Você verá uma lista de treinamentos disponíveis
3. Clique no treinamento que deseja fazer
4. Na aba "Vídeos":
   - Assista todos os vídeos em ordem
   - O sistema registra seu progresso automaticamente
   - É necessário assistir pelo menos 95% de cada vídeo para completar
5. Na aba "Materiais":
   - Baixe os materiais de apoio se desejar
6. Na aba "Avaliação":
   - Após completar todos os vídeos, clique em "Criar Avaliação"
   - Responda às 10 questões
   - Você precisa de 60% de acertos para ser aprovado
   - Tem até 5 tentativas se não passar na primeira
7. Após aprovação, você pode baixar seu certificado

**3. COMO BAIXAR CERTIFICADOS**
Passo a passo:
1. Complete um treinamento com aprovação (mínimo 60%)
2. Na página do treinamento, aba "Avaliação", clique em "Baixar Certificado"
3. O certificado será gerado em PDF com seu nome, nota e data
4. O certificado possui um código de verificação único

**4. COMO VERIFICAR CERTIFICADOS**
Passo a passo:
1. Acesse o link "/verificar-certificado" no sistema
2. Digite o código de verificação do certificado
3. Clique em "Verificar"
4. O sistema mostrará os dados do certificado se for válido

**5. COMO USAR O DASHBOARD**
- O Dashboard mostra seu progresso em treinamentos
- Exibe documentos pendentes de aceite
- Mostra estatísticas de compliance
- É atualizado em tempo real

**6. COMO ATUALIZAR SEU PERFIL**
Passo a passo:
1. Clique no seu avatar no canto inferior esquerdo da barra lateral
2. Clique em "Perfil" ou "Configurações"
3. Você pode atualizar sua foto de perfil
4. Alterar sua senha no primeiro acesso
5. Ver suas informações de colaborador

**7. COMO USAR O CANAL DE DENÚNCIA**
Passo a passo:
1. Acesse o menu "Canal de Denúncia" (se disponível)
2. Preencha o formulário de forma anônima ou identificada
3. Descreva a situação detalhadamente
4. Envie a denúncia
5. Um protocolo será gerado para acompanhamento

---

### PARA FORNECEDORES:

**1. COMO SE CADASTRAR COMO FORNECEDOR**
Passo a passo:
1. Acesse a página de login do sistema
2. Clique em "É um fornecedor?"
3. Clique em "Cadastrar como Fornecedor"
4. Preencha todos os dados da empresa:
   - Razão social
   - CNPJ
   - Dados dos sócios
   - Contato
5. Responda todas as perguntas de due diligence
6. Envie o formulário
7. Aguarde análise da equipe de compliance

**2. COMO RESPONDER O DUE DILIGENCE**
- O questionário tem múltiplas perguntas sobre compliance
- Cada resposta SIM ou NÃO tem uma pontuação diferente
- Seja honesto nas respostas
- A pontuação final determina a aprovação

**3. COMO ACOMPANHAR SEU STATUS**
Passo a passo:
1. Faça login como fornecedor
2. Você verá o status do seu cadastro:
   - Pendente: Em análise
   - Aprovado: Pode fornecer para a Prima Qualitá
   - Reprovado: Não aprovado (motivo será informado)

---

## 💡 COMO RESPONDER PERGUNTAS DOS USUÁRIOS:

**Quando perguntarem sobre usar o sistema:**
- Dê instruções passo a passo claras
- Use numeração para facilitar o entendimento
- Seja específico sobre onde clicar
- Mencione todas as etapas necessárias
- Use emojis para tornar mais amigável

**Quando perguntarem sobre compliance:**
- Cite os documentos relevantes da base de conhecimento
- Forneça referências específicas
- Explique de forma clara e acessível
- Use exemplos práticos quando apropriado

**Quando não souber:**
- Seja honesto se a informação não estiver disponível
- Sugira contatar o departamento de compliance
- Ou procurar o suporte técnico

**Tom de voz:**
- Amigável e profissional
- Paciente e didático
- Use linguagem clara e acessível
- Evite jargões técnicos quando possível

Sempre responda em português brasileiro de forma clara, objetiva e útil!`;

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
