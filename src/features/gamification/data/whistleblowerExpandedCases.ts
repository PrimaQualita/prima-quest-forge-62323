import { WhistleblowerCase } from '../types';
import { shuffleArray } from './expandedQuestions';

/**
 * 100+ Casos expandidos para o jogo Canal de Denúncias
 * Baseados em legislações vigentes (LGPD, Lei Anticorrupção, CLT, etc.)
 * e melhores práticas de compliance
 */
export const expandedWhistleblowerCases: WhistleblowerCase[] = [
  // =============== CASOS DE CORRUPÇÃO E FRAUDE ===============
  {
    id: 'case-1',
    report: 'Denúncia anônima relata que um gestor está solicitando vantagens financeiras de fornecedores para favorecer contratos.',
    options: [
      'Encaminhar imediatamente ao Compliance para investigação',
      'Solicitar mais informações ao denunciante',
      'Arquivar por falta de provas',
      'Confrontar o gestor diretamente'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Denúncias de corrupção devem ser encaminhadas imediatamente ao Compliance para investigação formal, preservando sigilo e evitando confrontos que possam comprometer evidências.'
  },
  {
    id: 'case-2',
    report: 'Funcionário relata que notas fiscais estão sendo emitidas por serviços nunca prestados, com valores sendo divididos entre funcionário e fornecedor.',
    options: [
      'Encaminhar ao Compliance e Auditoria para investigação imediata',
      'Pedir ao funcionário que reúna provas antes',
      'Alertar o departamento financeiro',
      'Aguardar próxima auditoria externa'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -35, reputation: 20 },
    explanation: 'Fraude em notas fiscais é crime grave que deve ser investigado imediatamente pelo Compliance e Auditoria, com preservação de evidências e sigilo.'
  },
  {
    id: 'case-3',
    report: 'Denúncia de "caixa dois": valores recebidos de pacientes particulares não estão sendo registrados oficialmente.',
    options: [
      'Encaminhar ao Compliance, Auditoria e considerar comunicação à Receita Federal',
      'Fazer auditoria interna primeiro',
      'Alertar apenas o contador',
      'Regularizar valores retroativamente'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -42, reputation: 25 },
    explanation: 'Caixa dois é crime tributário grave. Compliance deve investigar, preservar provas e considerar comunicação às autoridades fiscais conforme gravidade.'
  },
  {
    id: 'case-4',
    report: 'Relato de propina: representante comercial está oferecendo vantagens a médicos para prescreverem determinado medicamento.',
    options: [
      'Encaminhar ao Compliance e considerar denúncia ao CRM e MP',
      'Alertar o representante sobre ilegalidade',
      'Rescindir contrato com representante',
      'Monitorar vendas do medicamento'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -45, reputation: 28 },
    explanation: 'Propina a médicos viola Código de Ética Médica e pode configurar corrupção. Compliance deve investigar e comunicar ao CRM e, se necessário, ao Ministério Público.'
  },
  {
    id: 'case-5',
    report: 'Funcionário denuncia que licitações estão sendo direcionadas para empresa específica através de especificações técnicas restritivas.',
    options: [
      'Encaminhar ao Compliance e TCU/CGU para investigação de fraude em licitação',
      'Revisar apenas as especificações',
      'Cancelar licitação atual',
      'Aceitar se empresa é qualificada'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'Direcionamento de licitação é crime contra administração pública. Compliance deve investigar com rigor e comunicar aos órgãos de controle.'
  },

  // =============== CASOS DE ASSÉDIO ===============
  {
    id: 'case-6',
    report: 'Relato de assédio moral: funcionário afirma sofrer humilhações públicas constantes de sua liderança imediata.',
    options: [
      'Encaminhar ao RH e Compliance para investigação urgente',
      'Aguardar mais relatos para confirmar',
      'Pedir ao funcionário para resolver diretamente',
      'Aconselhar o funcionário a procurar outro emprego'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -25, reputation: 20 },
    explanation: 'Assédio moral é grave e requer investigação urgente. Deve ser encaminhado ao RH e Compliance, com proteção ao denunciante e medidas cautelares se necessário.'
  },
  {
    id: 'case-7',
    report: 'Denúncia de assédio sexual: colaboradora relata abordagens e comentários inadequados de superior hierárquico.',
    options: [
      'Encaminhar ao RH e Compliance com medidas de proteção imediatas',
      'Aguardar se há outras denúncias similares',
      'Sugerir transferência da colaboradora para outro setor',
      'Orientar a colaboradora a evitar o assediador'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -35, reputation: 25 },
    explanation: 'Assédio sexual é crime e requer ação imediata. Deve ser encaminhado ao RH e Compliance com proteção à vítima, afastamento cautelar do agressor e investigação rigorosa.'
  },
  {
    id: 'case-8',
    report: 'Funcionária relata que está sendo pressionada a aceitar convites para jantar pelo gestor, com insinuações de prejuízo na carreira se recusar.',
    options: [
      'Encaminhar ao RH e Compliance com proteção à vítima e afastamento cautelar',
      'Orientar a funcionária a evitar situações a sós',
      'Promover conversa entre as partes',
      'Aguardar se situação se repete'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -38, reputation: 25 },
    explanation: 'Pressão por favores com ameaça à carreira configura assédio sexual. Requer ação imediata com proteção à vítima e investigação rigorosa.'
  },
  {
    id: 'case-9',
    report: 'Denúncia de assédio coletivo: equipe inteira está sendo submetida a metas impossíveis com ameaças de demissão diárias.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de assédio moral organizacional',
      'Revisar metas estabelecidas',
      'Oferecer suporte psicológico à equipe',
      'Transferir líder para outro setor'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'Assédio moral organizacional afeta saúde mental da equipe e gera passivos trabalhistas. Compliance deve investigar práticas de gestão e aplicar medidas corretivas.'
  },
  {
    id: 'case-10',
    report: 'Colaborador relata que gestor faz piadas constantes sobre sua religião durante reuniões de equipe.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de assédio religioso',
      'Orientar gestor sobre respeito à diversidade',
      'Transferir colaborador para outra equipe',
      'Ignorar se piadas são "leves"'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Assédio religioso viola liberdade de crença garantida constitucionalmente. RH e Compliance devem investigar e aplicar medidas disciplinares.'
  },

  // =============== CASOS DE DISCRIMINAÇÃO ===============
  {
    id: 'case-11',
    report: 'Denúncia de discriminação: colaboradora relata não ter sido promovida devido ao seu gênero, enquanto colegas homens menos qualificados foram promovidos.',
    options: [
      'Encaminhar ao RH e Compliance para análise de processos seletivos',
      'Recomendar que a colaboradora busque advogado',
      'Orientar a colaboradora a conversar com RH informalmente',
      'Arquivar se não houver testemunhas'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 20 },
    explanation: 'Discriminação de gênero é grave e ilegal. Requer investigação formal do RH e Compliance, com análise de processos de promoção e possíveis medidas corretivas.'
  },
  {
    id: 'case-12',
    report: 'Funcionário negro relata ofensas raciais sistemáticas de colegas de equipe durante intervalos.',
    options: [
      'Encaminhar urgentemente ao RH e Compliance para investigação de racismo',
      'Promover palestra sobre diversidade',
      'Transferir o funcionário para outro setor',
      'Orientar sobre registro de boletim de ocorrência'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -35, reputation: 25 },
    explanation: 'Racismo é crime inafiançável. Requer investigação urgente pelo RH e Compliance, proteção à vítima, medidas disciplinares e possível ação judicial.'
  },
  {
    id: 'case-13',
    report: 'Denúncia de discriminação etária: candidatos acima de 50 anos são sistematicamente rejeitados em processos seletivos.',
    options: [
      'Encaminhar ao RH e Compliance para análise de políticas de recrutamento',
      'Estabelecer cotas etárias',
      'Treinar recrutadores sobre viés inconsciente',
      'Aceitar se baseado em adequação ao cargo'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Discriminação etária é ilegal. Compliance e RH devem investigar processos seletivos, treinar recrutadores e implementar políticas antidiscriminatórias.'
  },
  {
    id: 'case-14',
    report: 'Colaborador com deficiência relata que não recebe as adaptações necessárias para executar seu trabalho, apesar de solicitações formais.',
    options: [
      'Encaminhar ao RH e Compliance para garantir cumprimento de acessibilidade',
      'Verificar orçamento disponível',
      'Sugerir mudança de função',
      'Orientar sobre direitos legais'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'Negar adaptações razoáveis a PcD viola Lei Brasileira de Inclusão. RH e Compliance devem garantir cumprimento imediato das obrigações legais.'
  },
  {
    id: 'case-15',
    report: 'Funcionária gestante relata que foi preterida em projeto importante após anunciar gravidez.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de discriminação por gravidez',
      'Verificar se há motivos técnicos',
      'Reincluir funcionária no projeto',
      'Aguardar retorno de licença-maternidade'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -32, reputation: 22 },
    explanation: 'Discriminação por gravidez é ilegal e viola direitos trabalhistas. Compliance deve investigar e garantir igualdade de oportunidades.'
  },

  // =============== CASOS DE LGPD E PROTEÇÃO DE DADOS ===============
  {
    id: 'case-16',
    report: 'Funcionário relata que dados pessoais de clientes estão sendo acessados sem necessidade por diversos colaboradores.',
    options: [
      'Encaminhar ao DPO e Compliance para verificação urgente',
      'Solicitar lista de nomes dos colaboradores',
      'Ignorar, pois é acesso interno',
      'Orientar o funcionário a falar com seu gestor'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -35, reputation: 25 },
    explanation: 'Acesso indevido a dados pessoais viola a LGPD e deve ser tratado com urgência pelo DPO e Compliance, com auditoria de acessos e medidas corretivas imediatas.'
  },
  {
    id: 'case-17',
    report: 'Denúncia de vazamento: lista de pacientes com diagnóstico de HIV foi compartilhada em grupo de WhatsApp de funcionários.',
    options: [
      'Encaminhar urgentemente ao DPO, Compliance e ANPD',
      'Identificar quem compartilhou',
      'Orientar sobre sigilo médico',
      'Apagar mensagens do grupo'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -50, reputation: 40 },
    explanation: 'Vazamento de dados sensíveis de saúde é gravíssimo. Requer ação imediata do DPO, notificação à ANPD e aos titulares, além de medidas disciplinares.'
  },
  {
    id: 'case-18',
    report: 'Funcionário relata que banco de dados com informações de clientes está sendo copiado para dispositivo pessoal por colega.',
    options: [
      'Encaminhar ao DPO, Compliance e TI para investigação urgente',
      'Alertar o colega sobre irregularidade',
      'Bloquear portas USB',
      'Verificar se há autorização'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -42, reputation: 30 },
    explanation: 'Cópia não autorizada de dados pessoais viola LGPD e políticas de segurança. Requer investigação imediata com análise de logs e possíveis medidas legais.'
  },
  {
    id: 'case-19',
    report: 'Denúncia de uso indevido: dados de pacientes estão sendo usados para ofertas de planos de saúde sem consentimento.',
    options: [
      'Encaminhar ao DPO e Compliance para apuração de desvio de finalidade',
      'Verificar se há base legal',
      'Parar campanhas imediatamente',
      'Solicitar consentimento retroativo'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -38, reputation: 28 },
    explanation: 'Uso de dados para finalidade diferente da coletada viola princípio da LGPD. DPO deve apurar, parar uso indevido e notificar titulares se necessário.'
  },
  {
    id: 'case-20',
    report: 'Relato de que senhas de acesso ao sistema de prontuários são compartilhadas entre funcionários para "agilizar atendimento".',
    options: [
      'Encaminhar ao DPO e TI para auditoria de acessos e correção de práticas',
      'Orientar sobre uso individual de senhas',
      'Criar senhas genéricas por setor',
      'Aceitar se melhora atendimento'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'Compartilhamento de senhas viola segurança da informação e impede rastreabilidade. TI e DPO devem corrigir práticas e reforçar política de senhas pessoais.'
  },

  // =============== CASOS DE SEGURANÇA DO TRABALHO ===============
  {
    id: 'case-21',
    report: 'Colaborador relata que EPIs obrigatórios não estão sendo fornecidos na área de radiologia.',
    options: [
      'Encaminhar ao Compliance e SESMT para regularização imediata',
      'Verificar disponibilidade de EPIs',
      'Orientar colaboradores sobre importância',
      'Aguardar próxima compra'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -45, reputation: 25 },
    explanation: 'Não fornecer EPIs obrigatórios viola NRs e expõe trabalhadores a riscos. Compliance e SESMT devem regularizar imediatamente e garantir segurança.'
  },
  {
    id: 'case-22',
    report: 'Denúncia de acidente de trabalho não registrado: funcionário se acidentou mas foi orientado a não comunicar para não "sujar estatísticas".',
    options: [
      'Encaminhar ao Compliance e SESMT com abertura de CAT retroativa',
      'Verificar gravidade do acidente',
      'Orientar sobre direitos trabalhistas',
      'Investigar quem orientou omissão'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -42, reputation: 28 },
    explanation: 'Omissão de acidente de trabalho é crime e priva trabalhador de direitos. CAT deve ser emitida e responsáveis pela orientação de omissão punidos.'
  },
  {
    id: 'case-23',
    report: 'Funcionário relata que extintores de incêndio estão vencidos e saídas de emergência bloqueadas por materiais.',
    options: [
      'Encaminhar urgentemente ao Compliance e Brigada de Incêndio para correção',
      'Solicitar recarga de extintores',
      'Desobstruir saídas de emergência',
      'Agendar inspeção de segurança'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -48, reputation: 22 },
    explanation: 'Extintores vencidos e saídas bloqueadas são infrações graves que colocam vidas em risco. Correção deve ser imediata com comunicação aos órgãos de fiscalização.'
  },
  {
    id: 'case-24',
    report: 'Denúncia de jornada exaustiva: equipe de enfermagem está sendo obrigada a fazer plantões de 24h sem descanso adequado.',
    options: [
      'Encaminhar ao RH e Compliance para auditoria de jornada e correção',
      'Contratar mais profissionais',
      'Reorganizar escalas',
      'Aceitar em períodos de alta demanda'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'Jornada exaustiva viola CLT, coloca profissionais e pacientes em risco. RH e Compliance devem auditar, corrigir escalas e evitar reincidência.'
  },
  {
    id: 'case-25',
    report: 'Colaborador relata que treinamento obrigatório de segurança não foi realizado, mas certificados foram emitidos.',
    options: [
      'Encaminhar ao Compliance e SESMT para investigação de fraude documental',
      'Realizar treinamento corretivo',
      'Cancelar certificados emitidos',
      'Verificar responsável pela emissão'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 18 },
    explanation: 'Emissão de certificados sem treinamento é fraude e expõe trabalhadores a riscos. Compliance deve investigar, punir responsáveis e garantir treinamento real.'
  },

  // =============== CASOS DE CONFLITO DE INTERESSE ===============
  {
    id: 'case-26',
    report: 'Relato de conflito de interesses: gerente possui participação societária em empresa fornecedora sem ter declarado formalmente.',
    options: [
      'Encaminhar ao Compliance para investigação e aplicação de políticas',
      'Pedir ao gerente que venda suas ações',
      'Alertar apenas o superior imediato',
      'Ignorar se o trabalho dele é bom'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Conflito de interesses não declarado compromete a imparcialidade. Deve ser investigado pelo Compliance com aplicação das políticas de conflito de interesses.'
  },
  {
    id: 'case-27',
    report: 'Funcionário denuncia que diretor contratou sua esposa como consultora externa com valores acima do mercado.',
    options: [
      'Encaminhar ao Compliance para auditoria de contrato e conflito de interesse',
      'Renegociar valores de consultoria',
      'Aceitar se esposa é qualificada',
      'Trocar consultora por outra'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -32, reputation: 20 },
    explanation: 'Contratação de cônjuge sem declaração de conflito e com sobrepreço pode configurar fraude. Compliance deve auditar contrato e aplicar políticas.'
  },
  {
    id: 'case-28',
    report: 'Denúncia de nepotismo: diretor contratou seus dois filhos para cargos estratégicos sem processo seletivo formal.',
    options: [
      'Encaminhar ao Compliance para análise de política de parentesco',
      'Aceitar se os filhos são qualificados',
      'Sugerir que os filhos passem por avaliação de desempenho',
      'Ignorar se a área está performando bem'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Nepotismo viola princípios de imparcialidade e meritocracia. Deve ser analisado pelo Compliance conforme políticas de parentesco e conflito de interesses.'
  },
  {
    id: 'case-29',
    report: 'Funcionário relata que gestor favorece sempre o mesmo fornecedor, que coincidentemente patrocina time de futebol que ele dirige.',
    options: [
      'Encaminhar ao Compliance para investigação de conflito e favorecimento',
      'Verificar se fornecedor é competitivo',
      'Solicitar rodízio de fornecedores',
      'Proibir patrocínios externos'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -30, reputation: 18 },
    explanation: 'Favorecimento vinculado a benefício pessoal configura conflito de interesse grave. Compliance deve investigar relação e possível corrupção.'
  },
  {
    id: 'case-30',
    report: 'Médico denuncia que colega está encaminhando pacientes exclusivamente para clínica da qual é sócio.',
    options: [
      'Encaminhar ao Compliance e CRM para investigação de conflito e ética médica',
      'Orientar sobre declaração de conflito',
      'Proibir encaminhamentos para a clínica',
      'Aceitar se clínica é qualificada'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -35, reputation: 22 },
    explanation: 'Encaminhamento direcionado para benefício próprio viola ética médica. Compliance e CRM devem investigar e aplicar sanções cabíveis.'
  },

  // =============== CASOS DE FRAUDE DOCUMENTAL ===============
  {
    id: 'case-31',
    report: 'Funcionário relata que prontuários médicos estão sendo alterados para ocultar erros médicos graves.',
    options: [
      'Encaminhar urgentemente ao Compliance, CRM e autoridades sanitárias',
      'Alertar apenas a diretoria médica',
      'Fazer cópia dos prontuários alterados',
      'Aguardar se pacientes reclamarem'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -50, reputation: 35 },
    explanation: 'Alteração de prontuários para ocultar erros é crime gravíssimo. Requer investigação urgente pelo Compliance, CRM e possível comunicação ao Ministério Público.'
  },
  {
    id: 'case-32',
    report: 'Denúncia de diplomas falsos: funcionário está usando certificado de especialização que não concluiu.',
    options: [
      'Encaminhar ao RH e Compliance para verificação e medidas trabalhistas/criminais',
      'Solicitar comprovante atualizado',
      'Dar prazo para regularização',
      'Verificar apenas novos funcionários'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 18 },
    explanation: 'Uso de diploma falso é crime e pode comprometer segurança de pacientes. RH deve verificar, desligar se confirmado, e considerar denúncia criminal.'
  },
  {
    id: 'case-33',
    report: 'Funcionário relata que laudos de exames estão sendo liberados por profissionais não habilitados para reduzir fila.',
    options: [
      'Encaminhar urgentemente ao Compliance, CRM e vigilância sanitária',
      'Contratar mais profissionais habilitados',
      'Revisar todos os laudos suspeitos',
      'Advertir os responsáveis'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -48, reputation: 32 },
    explanation: 'Liberação de laudos por profissionais não habilitados é exercício ilegal da profissão e coloca vidas em risco. Requer ação imediata com CRM e autoridades.'
  },
  {
    id: 'case-34',
    report: 'Denúncia de fraude em ponto eletrônico: grupo de funcionários está registrando presença uns dos outros sem estar no trabalho.',
    options: [
      'Encaminhar ao RH e Compliance para auditoria de jornada e medidas disciplinares',
      'Advertir os funcionários envolvidos',
      'Implementar biometria facial',
      'Aumentar fiscalização presencial'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -25, reputation: 12 },
    explanation: 'Fraude em ponto eletrônico configura falta grave e pode gerar demissão por justa causa. RH e Compliance devem auditar, provar fraude e aplicar sanções.'
  },
  {
    id: 'case-35',
    report: 'Colaborador relata que atestados médicos estão sendo aceitos sem verificação, com suspeita de documentos falsos.',
    options: [
      'Encaminhar ao RH e Compliance para auditoria de atestados e verificação',
      'Implementar sistema de verificação',
      'Exigir atestados apenas de médicos conveniados',
      'Aceitar se frequência é baixa'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -28, reputation: 15 },
    explanation: 'Atestados falsos configuram fraude e demissão por justa causa. RH deve auditar, verificar autenticidade e tomar medidas disciplinares apropriadas.'
  },

  // =============== CASOS DE MEIO AMBIENTE E SAÚDE ===============
  {
    id: 'case-36',
    report: 'Relato de descarte inadequado de resíduos hospitalares infectantes em lixo comum, violando normas sanitárias.',
    options: [
      'Encaminhar urgentemente ao Compliance e vigilância sanitária',
      'Treinar equipe sobre descarte correto',
      'Aumentar fiscalização interna',
      'Contratar empresa especializada'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 30 },
    explanation: 'Descarte inadequado de resíduos infectantes é crime ambiental e sanitário grave. Requer ação imediata com Compliance e comunicação às autoridades sanitárias.'
  },
  {
    id: 'case-37',
    report: 'Funcionário relata que resíduos químicos perigosos estão sendo descartados em rede de esgoto comum.',
    options: [
      'Encaminhar urgentemente ao Compliance e órgãos ambientais',
      'Contratar empresa especializada em descarte',
      'Treinar equipe sobre descarte correto',
      'Construir área de armazenamento temporário'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -42, reputation: 32 },
    explanation: 'Descarte inadequado de resíduos químicos é crime ambiental grave. Requer ação imediata com Compliance e comunicação aos órgãos ambientais competentes.'
  },
  {
    id: 'case-38',
    report: 'Denúncia de uso de medicamentos vencidos: farmácia está reembalando medicamentos próximos ao vencimento.',
    options: [
      'Encaminhar urgentemente ao Compliance, ANVISA e polícia',
      'Fazer inventário de validades',
      'Descartar medicamentos vencidos',
      'Alertar farmacêutico responsável'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -55, reputation: 40 },
    explanation: 'Reembalagem de medicamentos vencidos é crime hediondo que coloca vidas em risco. Requer ação imediata com Compliance, ANVISA e autoridades policiais.'
  },
  {
    id: 'case-39',
    report: 'Funcionário relata que equipamentos médicos vencidos estão sendo reembalados e usados em procedimentos.',
    options: [
      'Encaminhar urgentemente ao Compliance, ANVISA e autoridades sanitárias',
      'Fazer inventário de validades',
      'Orientar equipe sobre verificação de validades',
      'Descartar equipamentos vencidos'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -52, reputation: 38 },
    explanation: 'Uso de equipamentos vencidos é crime sanitário gravíssimo que coloca vidas em risco. Requer ação imediata com Compliance e comunicação à ANVISA.'
  },
  {
    id: 'case-40',
    report: 'Denúncia de que alimentos servidos no refeitório estão em condições inadequadas de armazenamento.',
    options: [
      'Encaminhar ao Compliance e vigilância sanitária para inspeção',
      'Trocar fornecedor de alimentação',
      'Melhorar condições de armazenamento',
      'Orientar funcionários sobre higiene'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'Condições inadequadas de armazenamento de alimentos podem causar intoxicação. Compliance deve acionar vigilância sanitária e exigir correção imediata.'
  },

  // =============== CASOS DE VAZAMENTO DE INFORMAÇÕES ===============
  {
    id: 'case-41',
    report: 'Denúncia de vazamento de informações confidenciais da empresa para concorrentes por colaborador do setor comercial.',
    options: [
      'Encaminhar ao Compliance e TI para investigação urgente com análise de logs',
      'Demitir o colaborador imediatamente',
      'Alertar apenas a liderança comercial',
      'Monitorar o colaborador discretamente'
    ],
    idealIndex: 0,
    impacts: { trust: 15, risk: -40, reputation: 10 },
    explanation: 'Vazamento de informações confidenciais é grave. Requer investigação urgente com análise técnica de logs, preservação de evidências e possíveis medidas legais.'
  },
  {
    id: 'case-42',
    report: 'Funcionário relata que informações sobre pacientes VIPs estão sendo vendidas para tabloides.',
    options: [
      'Encaminhar ao Compliance, Jurídico e autoridades com análise de acessos',
      'Demitir por justa causa',
      'Restringir acessos do funcionário',
      'Alertar os pacientes afetados'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -45, reputation: 35 },
    explanation: 'Violação de sigilo médico é crime grave. Compliance deve investigar com análise de logs, alertar pacientes, e encaminhar ao Jurídico para ação criminal.'
  },
  {
    id: 'case-43',
    report: 'Denúncia de insider trading: executivo repassou informações privilegiadas sobre fusão a investidores externos.',
    options: [
      'Encaminhar ao Compliance e CVM com análise de movimentações financeiras',
      'Monitorar transações do executivo',
      'Advertir o executivo verbalmente',
      'Consultar o departamento jurídico'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -42, reputation: 18 },
    explanation: 'Insider trading é crime contra o mercado de capitais. Deve ser investigado pelo Compliance com comunicação à CVM e análise de movimentações financeiras suspeitas.'
  },
  {
    id: 'case-44',
    report: 'Funcionário relata que planilhas com salários de todos os funcionários foram compartilhadas em grupo de WhatsApp.',
    options: [
      'Encaminhar ao DPO e Compliance para investigação de vazamento',
      'Identificar quem compartilhou',
      'Apagar mensagens do grupo',
      'Alertar sobre confidencialidade'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 18 },
    explanation: 'Vazamento de dados salariais viola privacidade e LGPD. DPO e Compliance devem investigar, identificar responsáveis e aplicar medidas disciplinares.'
  },
  {
    id: 'case-45',
    report: 'Denúncia de que documentos estratégicos estão sendo fotografados e enviados para ex-funcionário que trabalha na concorrência.',
    options: [
      'Encaminhar ao Compliance e Jurídico para investigação e possível ação judicial',
      'Restringir acesso aos documentos',
      'Alertar o funcionário suspeito',
      'Instalar câmeras de vigilância'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -45, reputation: 22 },
    explanation: 'Espionagem industrial é crime grave. Compliance e Jurídico devem investigar, preservar provas e considerar ação judicial por concorrência desleal.'
  },

  // =============== CASOS DE TRABALHO IRREGULAR ===============
  {
    id: 'case-46',
    report: 'Denúncia de trabalho análogo à escravidão: terceirizada mantém funcionários em condições degradantes nas dependências da empresa.',
    options: [
      'Encaminhar urgentemente ao Compliance, Jurídico e MPT',
      'Pedir à terceirizada para melhorar as condições',
      'Rescindir contrato sem investigação',
      'Aguardar fiscalização externa'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -55, reputation: 40 },
    explanation: 'Trabalho análogo à escravidão é crime gravíssimo. Requer ação imediata com Compliance, Jurídico, MPT e possível rescisão do contrato com a terceirizada.'
  },
  {
    id: 'case-47',
    report: 'Relato de trabalho infantil: menor de 16 anos está trabalhando em área de risco sem autorização judicial.',
    options: [
      'Encaminhar urgentemente ao Compliance, MPT e Conselho Tutelar',
      'Regularizar documentação do menor',
      'Transferir o menor para área sem risco',
      'Orientar responsáveis sobre ilegalidade'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -55, reputation: 40 },
    explanation: 'Trabalho infantil em área de risco é crime gravíssimo. Requer ação imediata com Compliance, MPT, Conselho Tutelar e possível rescisão do contrato.'
  },
  {
    id: 'case-48',
    report: 'Funcionário relata que terceirizados não estão recebendo direitos trabalhistas como FGTS e férias.',
    options: [
      'Encaminhar ao Compliance e Jurídico para auditoria trabalhista',
      'Reter pagamentos até regularização',
      'Notificar a terceirizada formalmente',
      'Assumir pagamento dos direitos'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -32, reputation: 18 },
    explanation: 'Dumping social viola direitos trabalhistas e pode gerar responsabilidade solidária. Compliance deve auditar, exigir regularização ou rescindir contrato.'
  },
  {
    id: 'case-49',
    report: 'Denúncia de que estagiários estão executando atividades de funcionários efetivos, sem supervisão e além da carga horária permitida.',
    options: [
      'Encaminhar ao RH e Compliance para regularização do estágio',
      'Contratar estagiários como efetivos',
      'Reduzir atividades dos estagiários',
      'Verificar contratos de estágio'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -28, reputation: 15 },
    explanation: 'Desvio de função e jornada excessiva de estagiários viola Lei do Estágio e pode gerar vínculo empregatício. RH deve regularizar imediatamente.'
  },
  {
    id: 'case-50',
    report: 'Funcionário relata que gestor exige trabalho em feriados sem pagamento de hora extra ou compensação.',
    options: [
      'Encaminhar ao RH e Compliance para auditoria de jornada e pagamento',
      'Orientar sobre direitos trabalhistas',
      'Compensar horas retroativamente',
      'Aceitar se há banco de horas'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -25, reputation: 12 },
    explanation: 'Trabalho em feriado sem pagamento ou compensação viola CLT. RH deve auditar, pagar horas devidas e orientar gestores sobre legislação trabalhista.'
  },

  // =============== CASOS DE QUALIDADE E SEGURANÇA DO PACIENTE ===============
  {
    id: 'case-51',
    report: 'Funcionário relata que dados de pesquisas clínicas estão sendo manipulados para favorecer resultados positivos.',
    options: [
      'Encaminhar urgentemente ao Compliance, Pesquisa e ANVISA',
      'Solicitar revalidação dos dados',
      'Pedir segunda opinião de outro pesquisador',
      'Aguardar conclusão da pesquisa'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -48, reputation: 35 },
    explanation: 'Manipulação de dados de pesquisa clínica é fraude científica grave que coloca vidas em risco. Requer ação imediata com Compliance e autoridades regulatórias.'
  },
  {
    id: 'case-52',
    report: 'Denúncia de que cirurgias estão sendo realizadas sem consentimento informado adequado dos pacientes.',
    options: [
      'Encaminhar ao Compliance e CRM para investigação ética',
      'Revisar processos de consentimento',
      'Treinar equipe sobre TCLE',
      'Arquivar se não houve reclamação'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -40, reputation: 25 },
    explanation: 'Cirurgia sem consentimento informado viola direitos do paciente e ética médica. Compliance e CRM devem investigar e corrigir processos.'
  },
  {
    id: 'case-53',
    report: 'Funcionário relata que alarmes de equipamentos críticos estão sendo desativados para "não incomodar" a equipe noturna.',
    options: [
      'Encaminhar urgentemente ao Compliance e equipe técnica para correção',
      'Verificar calibração de alarmes',
      'Treinar equipe sobre importância',
      'Ajustar sensibilidade dos alarmes'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -55, reputation: 30 },
    explanation: 'Desativar alarmes de equipamentos críticos coloca vidas em risco. Requer ação imediata para restabelecer segurança e investigar responsáveis.'
  },
  {
    id: 'case-54',
    report: 'Denúncia de violência obstétrica: médico está realizando procedimentos desnecessários e dolorosos sem consentimento de parturientes.',
    options: [
      'Encaminhar urgentemente ao Compliance, CRM e MPF',
      'Alertar o médico sobre protocolos',
      'Treinar equipe sobre parto humanizado',
      'Oferecer segunda opinião às pacientes'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -50, reputation: 40 },
    explanation: 'Violência obstétrica é crime e viola direitos humanos. Requer investigação urgente pelo CRM, Compliance e possível ação pelo Ministério Público Federal.'
  },
  {
    id: 'case-55',
    report: 'Funcionário relata que protocolos de higienização das mãos não estão sendo seguidos, aumentando risco de infecções.',
    options: [
      'Encaminhar ao SCIH e Compliance para auditoria e correção',
      'Instalar mais dispensadores de álcool gel',
      'Realizar campanha de conscientização',
      'Monitorar apenas setores críticos'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'Falha na higienização das mãos aumenta risco de IRAS. SCIH e Compliance devem auditar, reforçar protocolos e monitorar adesão rigorosamente.'
  },

  // =============== CASOS DE RETALIAÇÃO ===============
  {
    id: 'case-56',
    report: 'Funcionário que fez denúncia anterior relata estar sofrendo retaliação: foi transferido, tem tarefas reduzidas e é excluído de reuniões.',
    options: [
      'Encaminhar urgentemente ao Compliance para investigação de retaliação',
      'Verificar se transferência foi coincidência',
      'Orientar sobre programa de proteção',
      'Reverter transferência imediatamente'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -35, reputation: 28 },
    explanation: 'Retaliação contra denunciante é gravíssima e viola política de proteção ao whistleblower. Compliance deve investigar e proteger denunciante imediatamente.'
  },
  {
    id: 'case-57',
    report: 'Denúncia de censura: funcionários são proibidos de relatar problemas de qualidade por medo de retaliação.',
    options: [
      'Encaminhar ao Compliance para investigação de clima organizacional e retaliação',
      'Fortalecer canal de denúncias anônimo',
      'Promover cultura de transparência',
      'Treinar gestores sobre feedback'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Clima de censura e retaliação compromete qualidade e segurança. Compliance deve investigar, proteger whistleblowers e promover cultura de transparência.'
  },
  {
    id: 'case-58',
    report: 'Funcionário relata que foi demitido logo após reportar irregularidades ao canal de denúncias.',
    options: [
      'Encaminhar urgentemente ao Compliance e Jurídico para investigação de demissão retaliativa',
      'Verificar motivos formais da demissão',
      'Oferecer recontratação',
      'Indenizar sem investigar'
    ],
    idealIndex: 0,
    impacts: { trust: 35, risk: -40, reputation: 32 },
    explanation: 'Demissão retaliativa é ilegal e grava. Compliance e Jurídico devem investigar conexão entre denúncia e demissão, podendo gerar reintegração e indenização.'
  },
  {
    id: 'case-59',
    report: 'Denúncia de assédio processual: gestor está abrindo processos administrativos vexatórios contra subordinados que o criticam.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de abuso de poder',
      'Revisar processos abertos pelo gestor',
      'Orientar subordinados sobre direitos',
      'Criar comissão de sindicância'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -28, reputation: 15 },
    explanation: 'Assédio processual é abuso de poder e forma de retaliação. RH e Compliance devem investigar processos, proteger vítimas e aplicar medidas disciplinares.'
  },
  {
    id: 'case-60',
    report: 'Colaboradora relata que desde que denunciou assédio, sua avaliação de desempenho caiu drasticamente sem justificativa.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de retaliação via avaliação',
      'Revisar critérios de avaliação',
      'Solicitar feedback detalhado ao gestor',
      'Aceitar se avaliação foi técnica'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 20 },
    explanation: 'Retaliação via avaliação de desempenho é forma dissimulada de punição. Compliance deve investigar padrão de avaliações antes e depois da denúncia.'
  },

  // =============== CASOS ADICIONAIS DIVERSOS ===============
  {
    id: 'case-61',
    report: 'Funcionário relata que indicadores de performance estão sendo manipulados para ocultar metas não atingidas.',
    options: [
      'Encaminhar ao Compliance para verificação de dados e processos',
      'Arquivar se não houve prejuízo financeiro',
      'Alertar apenas o gestor responsável',
      'Ignorar se as metas foram ajustadas depois'
    ],
    idealIndex: 0,
    impacts: { trust: 15, risk: -20, reputation: 10 },
    explanation: 'Manipulação de indicadores compromete a transparência e pode mascarar problemas graves. Deve ser investigada pelo Compliance com análise de dados e processos.'
  },
  {
    id: 'case-62',
    report: 'Denúncia de que gestor está coagindo subordinados a fazerem "vaquinha" para presentes caros para diretoria.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de constrangimento',
      'Tornar contribuições voluntárias e anônimas',
      'Alertar o gestor sobre constrangimento',
      'Proibir coletas de dinheiro'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -22, reputation: 12 },
    explanation: 'Coação para contribuições financeiras configura constrangimento ilegal. RH e Compliance devem investigar e aplicar políticas de relacionamento adequadas.'
  },
  {
    id: 'case-63',
    report: 'Funcionário relata que profissional de TI está fornecendo acessos privilegiados indevidos mediante pagamento.',
    options: [
      'Encaminhar ao Compliance e TI para investigação criminal de corrupção',
      'Revogar todos os acessos criados',
      'Afastar o profissional temporariamente',
      'Auditar todos os sistemas'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -45, reputation: 20 },
    explanation: 'Venda de acessos privilegiados é corrupção grave e compromete segurança da informação. Compliance deve investigar com rigor e considerar ação criminal.'
  },
  {
    id: 'case-64',
    report: 'Denúncia de sabotagem: funcionário está deliberadamente danificando equipamentos para prejudicar produção.',
    options: [
      'Encaminhar ao Compliance e Segurança para investigação com análise técnica',
      'Demitir por justa causa imediatamente',
      'Aumentar vigilância do funcionário',
      'Conversar com o funcionário sobre motivações'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -38, reputation: 15 },
    explanation: 'Sabotagem é crime grave. Compliance deve investigar com preservação de evidências técnicas e considerar medidas trabalhistas e criminais cabíveis.'
  },
  {
    id: 'case-65',
    report: 'Funcionário relata que médico está atendendo sob efeito de medicamentos controlados que afetam cognição.',
    options: [
      'Encaminhar urgentemente ao Compliance, CRM e considerar afastamento',
      'Afastar o médico cautelarmente',
      'Conversar com o médico sobre o problema',
      'Reduzir carga horária do médico'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -48, reputation: 35 },
    explanation: 'Exercício da medicina sob efeito de substâncias que afetam cognição coloca vidas em risco. Requer afastamento imediato e investigação pelo CRM.'
  },
  {
    id: 'case-66',
    report: 'Denúncia de assédio eleitoral: gestor pressiona equipe a votar em determinado candidato político.',
    options: [
      'Encaminhar ao Compliance e considerar denúncia ao Ministério Público Eleitoral',
      'Alertar o gestor sobre ilegalidade',
      'Ignorar após período eleitoral',
      'Orientar colaboradores a ignorarem'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Assédio eleitoral é crime eleitoral. Deve ser encaminhado ao Compliance e pode exigir denúncia ao Ministério Público Eleitoral conforme gravidade.'
  },
  {
    id: 'case-67',
    report: 'Funcionário relata que colaboradores estão consumindo bebidas alcoólicas durante expediente em área hospitalar.',
    options: [
      'Encaminhar ao RH e Compliance com teste toxicológico e medidas disciplinares',
      'Advertir verbalmente os envolvidos',
      'Ignorar se não afeta atendimento',
      'Proibir álcool nas dependências'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 18 },
    explanation: 'Consumo de álcool em ambiente hospitalar compromete segurança do paciente. RH e Compliance devem investigar, testar e aplicar medidas disciplinares.'
  },
  {
    id: 'case-68',
    report: 'Denúncia de cartel: empresas concorrentes estão combinando preços em contratos com hospital, elevando custos artificialmente.',
    options: [
      'Encaminhar ao Compliance e CADE para investigação de formação de cartel',
      'Renegociar preços',
      'Buscar novos fornecedores',
      'Fazer licitação mais ampla'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -38, reputation: 18 },
    explanation: 'Formação de cartel é crime contra a ordem econômica. Compliance deve coletar evidências e comunicar ao CADE para investigação e possível ação antitruste.'
  },
  {
    id: 'case-69',
    report: 'Funcionário relata que gestor está pressionando a falsificar relatórios de segurança para acelerar aprovação de projeto.',
    options: [
      'Encaminhar urgentemente ao Compliance e Segurança do Trabalho',
      'Alertar apenas o superior do solicitante',
      'Arquivar se ninguém se machucou',
      'Pedir ao colaborador para reunir evidências primeiro'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -45, reputation: 20 },
    explanation: 'Falsificação de relatórios de segurança coloca vidas em risco e é crime. Requer investigação urgente pelo Compliance e autoridades de segurança do trabalho.'
  },
  {
    id: 'case-70',
    report: 'Denúncia de fraude em pesquisa acadêmica: pesquisador está plagiando trabalhos para publicação institucional.',
    options: [
      'Encaminhar ao Compliance e Comitê de Ética em Pesquisa',
      'Alertar o pesquisador sobre plágio',
      'Retirar publicação',
      'Solicitar revisão por pares'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 25 },
    explanation: 'Plágio em pesquisa é fraude acadêmica grave. Compliance e Comitê de Ética devem investigar, retirar publicações e aplicar sanções conforme regulamento.'
  },
  {
    id: 'case-71',
    report: 'Funcionário relata que pesquisas de satisfação estão sendo manipuladas antes de apresentação à diretoria.',
    options: [
      'Encaminhar ao Compliance para auditoria de dados e transparência',
      'Solicitar dados brutos originais',
      'Contratar pesquisa externa independente',
      'Revisar metodologia de pesquisa'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -22, reputation: 12 },
    explanation: 'Manipulação de dados compromete tomada de decisão e pode mascarar problemas graves. Compliance deve auditar dados e garantir transparência nas informações.'
  },
  {
    id: 'case-72',
    report: 'Denúncia de favoritismo em promoções: apenas funcionários próximos ao diretor são promovidos, independente de meritocracia.',
    options: [
      'Encaminhar ao RH e Compliance para revisão de processos de carreira',
      'Estabelecer critérios claros de promoção',
      'Aceitar se os promovidos são competentes',
      'Criar comitê de promoções'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Favoritismo em promoções viola princípios de meritocracia e imparcialidade. RH e Compliance devem revisar processos e estabelecer critérios objetivos.'
  },
  {
    id: 'case-73',
    report: 'Funcionário relata que ambulâncias estão sendo usadas para transporte particular de diretores.',
    options: [
      'Encaminhar ao Compliance para investigação de uso de recursos',
      'Alertar os diretores sobre a inadequação',
      'Ignorar se não atrapalha emergências',
      'Criar política de uso de veículos'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -25, reputation: 12 },
    explanation: 'Uso indevido de recursos institucionais viola princípios de probidade. Compliance deve investigar e aplicar políticas de uso adequado de recursos.'
  },
  {
    id: 'case-74',
    report: 'Denúncia de que certificados e diplomas falsos estão sendo aceitos em processos seletivos sem verificação adequada.',
    options: [
      'Encaminhar ao RH e Compliance para auditoria de documentação e revisão de contratações',
      'Implementar verificação de diplomas',
      'Treinar RH sobre validação de documentos',
      'Exigir apostilamento de diplomas'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Aceitação de diplomas falsos compromete qualidade e segurança. RH e Compliance devem auditar contratações, validar documentos e revisar processos seletivos.'
  },
  {
    id: 'case-75',
    report: 'Funcionário relata que medicamentos controlados estão sendo desviados do estoque hospitalar.',
    options: [
      'Encaminhar imediatamente ao Compliance, Farmácia e autoridades sanitárias',
      'Fazer inventário para confirmar',
      'Alertar apenas o farmacêutico responsável',
      'Instalar câmeras antes de investigar'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -50, reputation: 30 },
    explanation: 'Desvio de medicamentos controlados é crime grave. Requer ação imediata envolvendo Compliance, autoridades sanitárias e possível comunicação à polícia.'
  },
  {
    id: 'case-76',
    report: 'Denúncia de apropriação indébita: tesoureiro está desviando recursos de fundo assistencial dos funcionários.',
    options: [
      'Encaminhar ao Compliance e considerar ação criminal',
      'Solicitar prestação de contas',
      'Afastar o tesoureiro temporariamente',
      'Fazer auditoria interna primeiro'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 20 },
    explanation: 'Apropriação indébita é crime patrimonial. Compliance deve investigar com rigor, preservar evidências e encaminhar ao Jurídico para possível ação criminal.'
  },
  {
    id: 'case-77',
    report: 'Funcionário relata que gestor está favorecendo sempre a mesma empresa fornecedora mesmo quando há propostas mais vantajosas.',
    options: [
      'Encaminhar ao Compliance para auditoria de processos de compra',
      'Investigar se há relação pessoal entre gestor e fornecedor',
      'Aceitar se a qualidade do fornecedor é boa',
      'Sugerir rotação de fornecedores'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -28, reputation: 12 },
    explanation: 'Favorecimento sistemático pode indicar corrupção ou conflito de interesses. Compliance deve auditar processos de compra e investigar possíveis irregularidades.'
  },
  {
    id: 'case-78',
    report: 'Denúncia de que superfaturamento está ocorrendo: empresa terceirizada está cobrando por serviços não prestados há meses.',
    options: [
      'Encaminhar ao Compliance e Auditoria para investigação e recuperação de valores',
      'Solicitar justificativa à terceirizada',
      'Reter pagamento até esclarecimentos',
      'Rescindir contrato sem investigar'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -35, reputation: 15 },
    explanation: 'Superfaturamento configura fraude. Compliance e Auditoria devem investigar, quantificar danos, recuperar valores e considerar medidas legais.'
  },
  {
    id: 'case-79',
    report: 'Funcionário relata que colaborador LGBT+ é constantemente alvo de piadas ofensivas no ambiente de trabalho.',
    options: [
      'Encaminhar ao RH e Compliance para proteção e investigação de LGBTfobia',
      'Promover palestra sobre diversidade',
      'Orientar o colaborador a ignorar',
      'Transferir o colaborador para área mais inclusiva'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'LGBTfobia é crime equiparado ao racismo. RH e Compliance devem investigar urgentemente, proteger a vítima e aplicar medidas disciplinares severas.'
  },
  {
    id: 'case-80',
    report: 'Denúncia de terrorismo psicológico: gestor ameaça constantemente equipe com demissões arbitrárias e humilhações.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de assédio moral coletivo',
      'Orientar equipe a procurar sindicato',
      'Promover mediação entre gestor e equipe',
      'Transferir colaboradores para outros setores'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -32, reputation: 22 },
    explanation: 'Assédio moral coletivo é grave e ilegal. RH e Compliance devem investigar urgentemente, proteger vítimas e aplicar medidas disciplinares severas.'
  },

  // =============== MAIS CASOS PARA COMPLETAR 100+ ===============
  {
    id: 'case-81',
    report: 'Funcionário denuncia que sistemas críticos estão funcionando sem manutenção preventiva há mais de um ano.',
    options: [
      'Encaminhar ao Compliance e TI para auditoria de manutenção e riscos',
      'Agendar manutenção corretiva',
      'Verificar contrato de manutenção',
      'Aceitar se sistemas estão funcionando'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -35, reputation: 18 },
    explanation: 'Falta de manutenção preventiva em sistemas críticos aumenta riscos operacionais. Compliance deve auditar e exigir plano de manutenção adequado.'
  },
  {
    id: 'case-82',
    report: 'Denúncia de que pacientes estão sendo cobrados por procedimentos cobertos pelo SUS.',
    options: [
      'Encaminhar ao Compliance e Ministério da Saúde para investigação',
      'Verificar tabela de procedimentos',
      'Orientar setor de faturamento',
      'Ressarcir pacientes afetados'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -42, reputation: 30 },
    explanation: 'Cobrar paciente por procedimento do SUS é crime. Compliance deve investigar, ressarcir pacientes e comunicar ao Ministério da Saúde.'
  },
  {
    id: 'case-83',
    report: 'Funcionário relata que documentos importantes estão sendo destruídos antes do prazo legal de guarda.',
    options: [
      'Encaminhar ao Compliance e Jurídico para investigação de destruição irregular',
      'Verificar tabela de temporalidade',
      'Orientar sobre prazos legais',
      'Implementar sistema de gestão documental'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -30, reputation: 18 },
    explanation: 'Destruição prematura de documentos pode violar obrigações legais e comprometer defesas. Compliance deve investigar e garantir cumprimento de prazos.'
  },
  {
    id: 'case-84',
    report: 'Denúncia de que gestor está usando cartão corporativo para despesas pessoais de forma recorrente.',
    options: [
      'Encaminhar ao Compliance e Auditoria para investigação de desvio',
      'Solicitar prestação de contas',
      'Bloquear cartão corporativo',
      'Descontar valores em folha'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 18 },
    explanation: 'Uso de cartão corporativo para fins pessoais configura apropriação indébita. Compliance deve investigar, recuperar valores e aplicar sanções.'
  },
  {
    id: 'case-85',
    report: 'Funcionário relata que amianto está sendo manipulado sem EPIs adequados durante reforma.',
    options: [
      'Encaminhar urgentemente ao Compliance, SESMT e órgãos de fiscalização',
      'Parar obra imediatamente',
      'Fornecer EPIs adequados',
      'Contratar empresa especializada'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -52, reputation: 28 },
    explanation: 'Manipulação de amianto sem proteção é gravíssimo risco à saúde. Requer paralisação imediata, EPIs adequados e comunicação aos órgãos fiscalizadores.'
  },
  {
    id: 'case-86',
    report: 'Denúncia de que resultados de exames estão sendo adulterados para melhorar indicadores de qualidade.',
    options: [
      'Encaminhar ao Compliance e CRM para investigação de fraude em diagnósticos',
      'Auditar amostra de exames',
      'Treinar equipe sobre ética',
      'Revisar indicadores de qualidade'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -48, reputation: 35 },
    explanation: 'Adulteração de resultados de exames é fraude grave que pode prejudicar diagnósticos. Compliance e CRM devem investigar com rigor.'
  },
  {
    id: 'case-87',
    report: 'Funcionário relata que gestora está assediando sexualmente estagiários durante horário de trabalho.',
    options: [
      'Encaminhar urgentemente ao RH e Compliance com proteção aos estagiários',
      'Conversar com a gestora sobre comportamento',
      'Transferir estagiários para outro setor',
      'Orientar estagiários sobre direitos'
    ],
    idealIndex: 0,
    impacts: { trust: 32, risk: -45, reputation: 30 },
    explanation: 'Assédio sexual contra estagiários é especialmente grave pela vulnerabilidade. Requer proteção imediata às vítimas e investigação rigorosa.'
  },
  {
    id: 'case-88',
    report: 'Denúncia de que funcionários estão sendo obrigados a assinar documentos em branco.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de coação',
      'Proibir assinaturas em branco',
      'Orientar sobre riscos',
      'Verificar quais documentos foram assinados'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -35, reputation: 20 },
    explanation: 'Obrigar assinatura em branco é coação e pode configurar crime. Compliance deve investigar, proteger funcionários e responsabilizar gestores.'
  },
  {
    id: 'case-89',
    report: 'Funcionário relata que câmeras de segurança estão sendo usadas para monitorar pausas e conversas pessoais de funcionários.',
    options: [
      'Encaminhar ao DPO e Compliance para análise de privacidade',
      'Revisar política de monitoramento',
      'Informar funcionários sobre câmeras',
      'Desativar câmeras em áreas de descanso'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Monitoramento excessivo pode violar privacidade e LGPD. DPO deve analisar proporcionalidade e garantir que monitoramento seja lícito e informado.'
  },
  {
    id: 'case-90',
    report: 'Denúncia de que demissões estão sendo feitas com base em gravidez ou planos de ter filhos.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de discriminação',
      'Verificar motivos formais das demissões',
      'Orientar gestores sobre estabilidade gestante',
      'Revisar política de demissões'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -38, reputation: 25 },
    explanation: 'Demissão por gravidez é discriminação ilegal com estabilidade garantida. Compliance deve investigar padrão de demissões e proteger trabalhadoras.'
  },
  {
    id: 'case-91',
    report: 'Funcionário relata que produtos de limpeza industriais estão sendo usados sem diluição adequada, causando irritações.',
    options: [
      'Encaminhar ao SESMT e Compliance para verificação de procedimentos',
      'Treinar equipe sobre diluição',
      'Trocar produtos por menos agressivos',
      'Fornecer EPIs adequados'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Uso inadequado de produtos químicos pode causar acidentes. SESMT deve verificar procedimentos, treinar equipe e garantir segurança.'
  },
  {
    id: 'case-92',
    report: 'Denúncia de que contratos estão sendo renovados automaticamente sem nova análise de compliance de fornecedores.',
    options: [
      'Encaminhar ao Compliance para auditoria de renovações e due diligence',
      'Implementar revisão periódica',
      'Cancelar renovações automáticas',
      'Aceitar se não há reclamações'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -28, reputation: 12 },
    explanation: 'Renovação sem due diligence pode manter fornecedores problemáticos. Compliance deve auditar e implementar revisão periódica obrigatória.'
  },
  {
    id: 'case-93',
    report: 'Funcionário relata que informações de prontuários estão sendo acessadas por curiosidade sobre celebridades internadas.',
    options: [
      'Encaminhar ao DPO e Compliance para auditoria de acessos e medidas disciplinares',
      'Restringir acessos a prontuários',
      'Treinar sobre sigilo',
      'Alertar funcionários sobre monitoramento'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -38, reputation: 28 },
    explanation: 'Acesso a prontuário sem necessidade profissional viola LGPD e sigilo médico. DPO deve auditar logs, identificar e punir responsáveis.'
  },
  {
    id: 'case-94',
    report: 'Denúncia de que plantões estão sendo vendidos entre médicos sem autorização da instituição.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de irregularidade',
      'Verificar escalas oficiais',
      'Proibir trocas não autorizadas',
      'Aceitar se não afeta atendimento'
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -25, reputation: 12 },
    explanation: 'Venda de plantões pode configurar irregularidade trabalhista e fiscal. RH e Compliance devem investigar e regularizar sistema de escalas.'
  },
  {
    id: 'case-95',
    report: 'Funcionário relata que computador de uso comum tem arquivos com senhas de todos os sistemas salvas em texto.',
    options: [
      'Encaminhar ao TI e Compliance para correção urgente de vulnerabilidade',
      'Deletar arquivo imediatamente',
      'Trocar todas as senhas',
      'Orientar sobre segurança de senhas'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -40, reputation: 18 },
    explanation: 'Senhas em texto expõem sistemas a invasões. TI deve corrigir vulnerabilidade imediatamente, trocar senhas e implementar gestão segura de credenciais.'
  },
  {
    id: 'case-96',
    report: 'Denúncia de que funcionários temporários estão há mais de 2 anos na mesma função sem efetivação ou renovação formal.',
    options: [
      'Encaminhar ao RH e Compliance para regularização trabalhista',
      'Efetivar funcionários qualificados',
      'Renovar contratos temporários',
      'Aceitar se não há reclamação'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Manutenção irregular de temporários gera vínculo empregatício e passivos. RH deve regularizar situação imediatamente.'
  },
  {
    id: 'case-97',
    report: 'Funcionário relata que gestor está exigindo metas impossíveis sob ameaça de demissão por justa causa.',
    options: [
      'Encaminhar ao RH e Compliance para investigação de assédio moral',
      'Revisar metas estabelecidas',
      'Orientar gestor sobre liderança',
      'Aceitar se metas são desafiadoras'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Metas impossíveis com ameaças configura assédio moral. RH e Compliance devem investigar, proteger funcionários e corrigir práticas de gestão.'
  },
  {
    id: 'case-98',
    report: 'Denúncia de que doações de equipamentos estão sendo desviadas para clínica particular de diretor.',
    options: [
      'Encaminhar ao Compliance e Jurídico para investigação de desvio',
      'Verificar registro de doações',
      'Exigir devolução de equipamentos',
      'Alertar doadores sobre desvio'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -42, reputation: 25 },
    explanation: 'Desvio de doações é crime grave que viola confiança de doadores. Compliance deve investigar, recuperar bens e responsabilizar envolvidos.'
  },
  {
    id: 'case-99',
    report: 'Funcionário relata que documentos com dados pessoais de pacientes estão sendo jogados em lixo comum.',
    options: [
      'Encaminhar ao DPO e Compliance para correção e treinamento',
      'Instalar fragmentadoras',
      'Treinar sobre descarte',
      'Verificar se há dados sensíveis'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'Descarte inadequado de dados pessoais viola LGPD. DPO deve corrigir procedimento, treinar equipe e garantir descarte seguro.'
  },
  {
    id: 'case-100',
    report: 'Denúncia de que funcionário está gravando reuniões confidenciais e compartilhando com terceiros.',
    options: [
      'Encaminhar ao Compliance e Jurídico para investigação de vazamento',
      'Proibir dispositivos em reuniões',
      'Identificar o funcionário',
      'Alertar participantes das reuniões'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'Gravação e compartilhamento não autorizado de reuniões confidenciais pode configurar crime. Compliance deve investigar e aplicar medidas legais.'
  }
];

/**
 * Função para obter casos embaralhados para o jogo
 * @param count Número de casos a retornar (padrão: 8)
 * @returns Array de casos embaralhados com opções também embaralhadas
 */
export function getShuffledWhistleblowerCases(count: number = 8): Array<WhistleblowerCase & { correctIndex: number }> {
  // Embaralha todos os casos e pega os primeiros 'count'
  const shuffledCases = shuffleArray([...expandedWhistleblowerCases]).slice(0, count);
  
  // Para cada caso, embaralha as opções e ajusta o índice correto
  return shuffledCases.map(caseItem => {
    const originalCorrectAnswer = caseItem.options[caseItem.idealIndex];
    const shuffledOptions = shuffleArray([...caseItem.options]);
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectAnswer);
    
    return {
      ...caseItem,
      options: shuffledOptions,
      correctIndex: newCorrectIndex
    };
  });
}
