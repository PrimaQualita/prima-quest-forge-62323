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
      { data: trainingDocuments },
      { data: employees },
      { data: inactiveEmployees },
      { data: contracts },
      { data: suppliers },
      { data: trainingVideos },
      { data: trainingParticipations },
      { data: documentAcknowledgments },
      { data: contractRenewals },
    ] = await Promise.all([
      supabase
        .from('compliance_documents')
        .select('title, content, description, category')
        .order('created_at', { ascending: false }),
      supabase
        .from('due_diligence_questions')
        .select('question, is_active')
        .eq('is_active', true)
        .order('question_order', { ascending: true }),
      supabase
        .from('trainings')
        .select('title, description, category, duration_hours, passing_score, is_trail')
        .order('created_at', { ascending: false }),
      supabase
        .from('training_documents')
        .select('file_name, training_id')
        .order('created_at', { ascending: false }),
      supabase
        .from('employees')
        .select('name, department, job_title, email, is_manager, management_contract_id, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('employees')
        .select('name, department, job_title, deactivated_at')
        .eq('is_active', false)
        .order('name', { ascending: true }),
      supabase
        .from('management_contracts')
        .select('name, description, start_date, end_date, is_active')
        .order('created_at', { ascending: false }),
      supabase
        .from('supplier_due_diligence')
        .select('company_name, cnpj, status, total_score, owner, email, reviewed_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('training_videos')
        .select('title, training_id, duration_minutes, video_order')
        .order('video_order', { ascending: true }),
      supabase
        .from('training_participations')
        .select('employee_id, training_id, completed, completion_date')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('document_acknowledgments')
        .select('employee_id, document_id, quiz_answered, quiz_correct, acknowledged_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('contract_renewals')
        .select('contract_id, renewal_start_date, renewal_end_date, notes')
        .order('created_at', { ascending: false }),
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
    
    // Colaboradores Ativos
    if (employees && employees.length > 0) {
      knowledgeBase += `\n\n=== COLABORADORES ATIVOS (${employees.length} total) ===\n\n`;
      const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
      knowledgeBase += `Departamentos: ${departments.join(', ')}\n`;
      const managers = employees.filter(e => e.is_manager);
      if (managers.length > 0) {
        knowledgeBase += `\nGestores:\n`;
        managers.forEach(m => knowledgeBase += `- ${m.name} (${m.department || 'Sem depto'})\n`);
      }
      knowledgeBase += `\nLista completa:\n`;
      employees.forEach(e => {
        knowledgeBase += `- ${e.name} | Depto: ${e.department || 'N/A'} | Cargo: ${e.job_title || 'N/A'} | Gestor: ${e.is_manager ? 'Sim' : 'Não'}\n`;
      });
    }

    // Colaboradores Inativos
    if (inactiveEmployees && inactiveEmployees.length > 0) {
      knowledgeBase += `\n\n=== COLABORADORES INATIVOS (${inactiveEmployees.length} total) ===\n\n`;
      inactiveEmployees.forEach(e => {
        knowledgeBase += `- ${e.name} | Depto: ${e.department || 'N/A'} | Desativado em: ${e.deactivated_at || 'N/A'}\n`;
      });
    }

    // Contratos de Gestão
    if (contracts && contracts.length > 0) {
      knowledgeBase += `\n\n=== CONTRATOS DE GESTÃO (${contracts.length} total) ===\n\n`;
      contracts.forEach(c => {
        knowledgeBase += `- **${c.name}** | Status: ${c.is_active ? 'Ativo' : 'Encerrado'} | Início: ${c.start_date || 'N/A'} | Fim: ${c.end_date || 'N/A'}\n`;
        if (c.description) knowledgeBase += `  Descrição: ${c.description}\n`;
      });
    }

    // Renovações de Contratos
    if (contractRenewals && contractRenewals.length > 0) {
      knowledgeBase += `\n\n=== RENOVAÇÕES DE CONTRATOS ===\n\n`;
      contractRenewals.forEach(r => {
        knowledgeBase += `- Contrato: ${r.contract_id} | De: ${r.renewal_start_date} até ${r.renewal_end_date}${r.notes ? ' | Obs: ' + r.notes : ''}\n`;
      });
    }

    // Fornecedores
    if (suppliers && suppliers.length > 0) {
      knowledgeBase += `\n\n=== FORNECEDORES / DUE DILIGENCE (${suppliers.length} total) ===\n\n`;
      const statusCount: Record<string, number> = {};
      suppliers.forEach(s => { statusCount[s.status || 'pending'] = (statusCount[s.status || 'pending'] || 0) + 1; });
      knowledgeBase += `Resumo por status: ${Object.entries(statusCount).map(([k,v]) => `${k}: ${v}`).join(', ')}\n\n`;
      suppliers.forEach(s => {
        knowledgeBase += `- **${s.company_name}** (CNPJ: ${s.cnpj}) | Status: ${s.status} | Pontuação: ${s.total_score || 0} | Responsável: ${s.owner}\n`;
      });
    }

    // Vídeos de Treinamento
    if (trainingVideos && trainingVideos.length > 0) {
      knowledgeBase += `\n\n=== VÍDEOS DE TREINAMENTO (${trainingVideos.length} total) ===\n\n`;
      trainingVideos.forEach(v => {
        knowledgeBase += `- ${v.title} | Duração: ${v.duration_minutes || 'N/A'} min\n`;
      });
    }

    // Estatísticas de Participação
    if (trainingParticipations && trainingParticipations.length > 0) {
      const completed = trainingParticipations.filter(p => p.completed).length;
      const pending = trainingParticipations.length - completed;
      knowledgeBase += `\n\n=== ESTATÍSTICAS DE TREINAMENTOS ===\n`;
      knowledgeBase += `Total de participações: ${trainingParticipations.length} | Concluídos: ${completed} | Pendentes: ${pending}\n`;
    }

    // Estatísticas de Aceites de Documentos
    if (documentAcknowledgments && documentAcknowledgments.length > 0) {
      const acked = documentAcknowledgments.filter(a => a.acknowledged_at).length;
      const quizCorrect = documentAcknowledgments.filter(a => a.quiz_correct).length;
      knowledgeBase += `\n\n=== ESTATÍSTICAS DE REGULAMENTOS ===\n`;
      knowledgeBase += `Total de aceites: ${acked} | Quiz respondidos corretamente: ${quizCorrect}\n`;
    }

    const systemPrompt = `Você é o assistente inteligente da Prima Qualitá Saúde. Você tem acesso COMPLETO a todas as informações do sistema e pode responder sobre qualquer módulo.

---

## 📚 BASE DE CONHECIMENTO COMPLETA:
${knowledgeBase}

---

## 🎯 MENUS E FUNCIONALIDADES DO SISTEMA:

### Para TODOS os usuários:
- **Dashboard**: Visão geral do progresso pessoal, documentos pendentes, treinamentos, e status geral
- **Regulamentos**: Biblioteca de documentos de compliance. Colaboradores devem ler e aceitar cada documento, respondendo um quiz de verificação
- **Treinamentos**: Cursos com vídeos educativos e avaliações. Inclui certificados digitais verificáveis
- **Chatbot**: Este assistente para tirar dúvidas
- **Perfil**: Gerenciamento de dados pessoais e foto
- **Gamificação**: Jogos educativos sobre compliance (Quiz de Ética, Missão Integridade, Caça Riscos, Guardião de Dados, Corrida Compliance, Canal de Denúncias)

### Para GESTORES (Administradores):
- **Contratos de Gestão**: Cadastro, visualização e renovação de contratos. Controle de vigência e status (ativo/encerrado). Upload de documentos mensais por contrato
- **Relatórios**: Analytics completos - status por colaborador (ativos/inativos), progresso de treinamentos, aceites de regulamentos, exportação PDF
- **Colaboradores**: Cadastro individual ou por CSV, gerenciamento de equipe, ativação/desativação, vinculação a contratos, definição de gestores
- **Colaboradores Inativos**: Lista de colaboradores desativados com possibilidade de reativação
- **Due Diligence de Fornecedores**: Avaliação de fornecedores com questionário de compliance, aprovação/reprovação, geração de relatórios
- **Portal de Fornecedores**: Área onde fornecedores se cadastram e respondem o questionário

---

## 📝 GUIAS DETALHADOS:

### Colaboradores - Aceitar Regulamentos:
1. Menu "Regulamentos" → escolha o documento
2. Leia o conteúdo completo
3. Marque "Li e aceito" no final
4. Responda o quiz de verificação
5. Confirme o aceite

### Colaboradores - Fazer Treinamentos:
1. Menu "Treinamentos" → escolha o curso
2. Aba "Vídeos": assista 95%+ de cada vídeo (obrigatório)
3. Aba "Avaliação": crie e faça a prova
4. Nota mínima para aprovação varia por treinamento (geralmente 60%)
5. Máximo de 5 tentativas por avaliação
6. Após aprovação: baixe o certificado digital com código de verificação

### Gestores - Gerenciar Colaboradores:
1. Menu "Colaboradores" → "Novo Colaborador" ou importar CSV
2. Campos: Nome, CPF, Data de Nascimento, Email, Telefone, Departamento, Cargo
3. Vincular a um Contrato de Gestão
4. Definir se é gestor (acesso admin)
5. Sistema cria automaticamente login (CPF como usuário, data de nascimento como senha)

### Gestores - Contratos de Gestão:
1. Menu "Contratos" → "Novo Contrato"
2. Definir nome, descrição, data início
3. Adicionar renovações com datas de vigência
4. Upload de documentos mensais organizados por ano/mês
5. Sistema atualiza automaticamente status ativo/encerrado baseado nas datas

### Gestores - Due Diligence:
1. Fornecedor se cadastra pelo portal
2. Responde questionário de compliance
3. Sistema calcula pontuação de risco
4. Gestor analisa e aprova/reprova
5. Pode gerar relatório PDF da avaliação

### Fornecedores - Cadastro:
1. Acessar sistema → "É um fornecedor?" → "Cadastrar"
2. Criar conta com email e senha
3. Preencher dados da empresa (Razão Social, CNPJ, sócios)
4. Responder questionário de due diligence
5. Aguardar análise do gestor de compliance

### Verificação de Certificados:
- Qualquer pessoa pode verificar em /verificar-certificado
- Digitar o código impresso no certificado
- Sistema confirma autenticidade

---

## 💡 COMO RESPONDER:

- **Perguntas sobre o sistema**: Instruções diretas com passo a passo numerado
- **Perguntas sobre dados**: Use os dados reais da base de conhecimento acima
- **Perguntas sobre compliance**: Cite os documentos e regulamentos cadastrados
- **Estatísticas**: Forneça números reais baseados nos dados disponíveis
- **Não souber**: Indique contato com o setor de compliance
- **Tom**: Amigável, profissional, claro e conciso
- Use emojis para tornar mais visual e organizado
- Quando citar colaboradores ou fornecedores, use os dados reais

IMPORTANTE: Você tem acesso a dados reais do sistema. Use-os para dar respostas precisas e contextualizadas!

Responda sempre em português brasileiro!`;

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
