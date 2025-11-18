import { 
  IntegrityScenario, 
  RiskHotspot, 
  QuizQuestion, 
  WhistleblowerCase, 
  ComplianceAction,
  GameInfo,
  Badge
} from '../types';

// Informações dos jogos
export const gamesInfo: GameInfo[] = [
  {
    id: 'integrity-mission',
    name: 'Missão Integridade',
    description: 'Enfrente dilemas éticos e tome decisões baseadas em integridade',
    difficulty: 'Fácil',
    icon: '🎯',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'compliance-runner',
    name: 'Corrida Compliance',
    description: 'Avance por fases respondendo perguntas sobre regulamentos institucionais',
    difficulty: 'Intermediário',
    icon: '🏃',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'ethics-quiz',
    name: 'Quiz da Ética',
    description: 'Teste seus conhecimentos sobre ética, integridade e LGPD',
    difficulty: 'Fácil',
    icon: '❓',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'data-guardian',
    name: 'Guardião dos Dados',
    description: 'Proteja dados pessoais de hackers e vazamentos',
    difficulty: 'Intermediário',
    icon: '🛡️',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'whistleblower-decision',
    name: 'Canal de Denúncias',
    description: 'Gerencie denúncias com responsabilidade e sigilo',
    difficulty: 'Avançado',
    icon: '📢',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'compliance-tycoon',
    name: 'Compliance Tycoon',
    description: 'Gerencie recursos e construa um programa de compliance robusto',
    difficulty: 'Avançado',
    icon: '💼',
    color: 'from-indigo-500 to-indigo-600'
  }
];

// Medalhas disponíveis
export const availableBadges: Badge[] = [
  {
    id: 'iniciante_etico',
    name: 'Iniciante Ético',
    description: 'Complete seu primeiro jogo',
    icon: '🌟',
    unlocked: false
  },
  {
    id: 'guardiao_dados',
    name: 'Guardião de Dados',
    description: 'Excelente performance no Guardião dos Dados',
    icon: '🛡️',
    unlocked: false
  },
  {
    id: 'cacador_riscos',
    name: 'Caçador de Riscos',
    description: 'Encontre todos os riscos no jogo Caça aos Riscos',
    icon: '🔍',
    unlocked: false
  },
  {
    id: 'guardiao_canal_denuncias',
    name: 'Guardião do Canal',
    description: 'Excelência nas decisões sobre denúncias',
    icon: '📢',
    unlocked: false
  },
  {
    id: 'mestre_integridade',
    name: 'Mestre da Integridade',
    description: 'Alta pontuação geral em todos os jogos',
    icon: '👑',
    unlocked: false
  },
  {
    id: 'estrategista_compliance',
    name: 'Estrategista Compliance',
    description: 'Excelência no Compliance Tycoon',
    icon: '💼',
    unlocked: false
  }
];

// Dados do Jogo 1 - Missão Integridade
export const integrityScenarios: IntegrityScenario[] = [
  {
    id: 'scenario-1',
    title: 'Brinde de Alto Valor',
    description: 'Um fornecedor importante oferece a você um brinde de alto valor (equivalente a 2 salários mínimos) como "presente de fim de ano". O que você faz?',
    options: [
      'Aceito o presente, pois é uma demonstração de boa relação comercial',
      'Recuso educadamente e explico as políticas da empresa',
      'Aceito, mas aviso meu gestor depois',
      'Aceito apenas se outros colegas também receberem'
    ],
    correctIndex: 1,
    explanation: 'Presentes de alto valor podem comprometer a imparcialidade nas decisões. O Código de Ética estabelece limites claros e deve-se recusar educadamente, explicando as políticas da organização.'
  },
  {
    id: 'scenario-2',
    title: 'Jeitinho para Familiar',
    description: 'Um familiar próximo pede que você "acelere" um processo administrativo que normalmente levaria 30 dias. Você tem acesso ao sistema. O que faz?',
    options: [
      'Ajudo meu familiar, afinal não estou fazendo nada ilegal',
      'Explico que não posso dar tratamento diferenciado',
      'Faço apenas desta vez, pois é família',
      'Peço a um colega para fazer no meu lugar'
    ],
    correctIndex: 1,
    explanation: 'Isonomia e imparcialidade são princípios fundamentais. Dar tratamento diferenciado, mesmo para familiares, compromete a integridade e pode configurar nepotismo ou favorecimento indevido.'
  },
  {
    id: 'scenario-3',
    title: 'Uso de Recursos Oficiais',
    description: 'Você precisa buscar seu filho na escola às 16h. O carro oficial está disponível e fica no caminho. Qual sua decisão?',
    options: [
      'Uso o carro, pois está no caminho mesmo',
      'Não uso recursos oficiais para fins pessoais',
      'Uso apenas se ninguém precisar',
      'Uso e depois compenso ficando mais tempo no trabalho'
    ],
    correctIndex: 1,
    explanation: 'Recursos da organização (veículos, materiais, equipamentos) são destinados exclusivamente para fins institucionais. O uso para fins pessoais configura apropriação indevida, independentemente da justificativa.'
  },
  {
    id: 'scenario-4',
    title: 'Erro de Colega',
    description: 'Seu melhor amigo no trabalho cometeu um erro grave que pode causar prejuízo financeiro significativo à empresa. Ele pede que você não comente com ninguém. O que você faz?',
    options: [
      'Não comento, pois é meu amigo e confio nele',
      'Reporto o erro aos superiores imediatamente',
      'Ajudo a corrigir sem reportar',
      'Dou um tempo para ele se explicar primeiro'
    ],
    correctIndex: 1,
    explanation: 'A lealdade à organização e aos princípios éticos está acima de relações pessoais. Erros graves devem ser reportados imediatamente aos canais competentes para que medidas corretivas sejam tomadas e prejuízos minimizados.'
  }
];

// Dados do Jogo 2 - Caça aos Riscos
export const riskHotspots: RiskHotspot[] = [
  {
    id: 'risk-1',
    label: 'Documento Confidencial',
    description: 'Documento confidencial aberto sobre a mesa',
    explanation: 'Documentos confidenciais expostos podem ser visualizados por pessoas não autorizadas, causando vazamento de informações estratégicas.',
    posX: 25,
    posY: 40
  },
  {
    id: 'risk-2',
    label: 'Computador Desbloqueado',
    description: 'Computador ligado e desbloqueado sem usuário',
    explanation: 'Estações de trabalho desbloqueadas permitem acesso não autorizado a sistemas e dados. Sempre bloqueie seu computador ao se ausentar.',
    posX: 60,
    posY: 35
  },
  {
    id: 'risk-3',
    label: 'Caixa Sem Identificação',
    description: 'Caixa sem identificação ou etiqueta',
    explanation: 'Materiais sem identificação adequada dificultam o controle de estoque e rastreabilidade, podendo conter itens vencidos ou inadequados.',
    posX: 15,
    posY: 70
  },
  {
    id: 'risk-4',
    label: 'Material Vencido',
    description: 'Produto com data de validade vencida',
    explanation: 'Produtos vencidos na linha de produção ou armazenamento representam risco à qualidade, saúde e podem gerar não conformidades graves.',
    posX: 75,
    posY: 65
  },
  {
    id: 'risk-5',
    label: 'Lixeira Sem Tampa',
    description: 'Lixeira de documentos sem tampa ou triturador',
    explanation: 'Documentos descartados inadequadamente podem ser recuperados, expondo informações sensíveis. Use trituradores para descarte seguro.',
    posX: 85,
    posY: 45
  }
];

// Dados do Jogo 3 - Quiz da Ética
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'O que caracteriza um conflito de interesses?',
    alternatives: [
      'Ter uma discussão com um colega de trabalho',
      'Situação em que interesses pessoais interferem no julgamento profissional',
      'Discordar de uma decisão da gestão',
      'Trabalhar em mais de uma empresa'
    ],
    correctIndex: 1,
    explanation: 'Conflito de interesses ocorre quando interesses pessoais, familiares ou financeiros podem comprometer a imparcialidade nas decisões profissionais.'
  },
  {
    id: 'q2',
    question: 'Segundo a LGPD, dado pessoal sensível NÃO inclui:',
    alternatives: [
      'Origem racial ou étnica',
      'Convicção religiosa',
      'Opinião política',
      'Endereço de e-mail corporativo'
    ],
    correctIndex: 3,
    explanation: 'E-mail corporativo não é considerado dado sensível. Dados sensíveis incluem informações sobre origem racial, religião, política, saúde, orientação sexual, entre outros.'
  },
  {
    id: 'q3',
    question: 'Qual o prazo adequado para reportar uma suspeita de fraude?',
    alternatives: [
      'Aguardar ter certeza absoluta antes de reportar',
      'Reportar imediatamente ao canal apropriado',
      'Comentar com colegas para confirmar a suspeita',
      'Investigar por conta própria primeiro'
    ],
    correctIndex: 1,
    explanation: 'Suspeitas de fraude devem ser reportadas imediatamente aos canais adequados (Compliance, Canal de Denúncias). Não é necessário ter certeza absoluta, nem se deve investigar sozinho.'
  },
  {
    id: 'q4',
    question: 'Relacionamento ético com fornecedores significa:',
    alternatives: [
      'Dar preferência a fornecedores que oferecem brindes',
      'Tratamento isonômico, transparente e baseado em critérios técnicos',
      'Sempre escolher o fornecedor mais barato',
      'Manter relacionamento informal para facilitar negociações'
    ],
    correctIndex: 1,
    explanation: 'O relacionamento com fornecedores deve ser pautado por isonomia, transparência, critérios técnicos objetivos e imparcialidade, evitando favorecimentos e conflitos de interesse.'
  },
  {
    id: 'q5',
    question: 'O que NÃO é permitido fazer com dados pessoais de clientes?',
    alternatives: [
      'Coletar apenas dados necessários para a finalidade',
      'Compartilhar com terceiros sem consentimento',
      'Armazenar com segurança',
      'Permitir acesso do titular aos seus dados'
    ],
    correctIndex: 1,
    explanation: 'Compartilhar dados pessoais com terceiros sem consentimento do titular ou base legal viola a LGPD. Dados só podem ser tratados conforme a finalidade informada e com consentimento.'
  },
  {
    id: 'q6',
    question: 'Qual atitude demonstra integridade no ambiente de trabalho?',
    alternatives: [
      'Omitir erros para não prejudicar a equipe',
      'Assumir responsabilidade por erros e buscar correção',
      'Culpar outros quando algo der errado',
      'Fazer apenas o mínimo necessário'
    ],
    correctIndex: 1,
    explanation: 'Integridade envolve assumir responsabilidade, ser transparente, admitir erros e buscar corrigi-los. Omissão e falta de transparência comprometem a confiança e a ética.'
  }
];

// Dados do Jogo 5 - Canal de Denúncias (Expandido para 50+ casos)
export const whistleblowerCases: WhistleblowerCase[] = [
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
    id: 'case-3',
    report: 'Denúncia de possível fraude em notas fiscais de despesas de viagens corporativas.',
    options: [
      'Alertar o suspeito para se explicar',
      'Arquivar se não houver provas concretas',
      'Encaminhar para auditoria interna investigar',
      'Solicitar ao denunciante mais detalhes e evidências'
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -20, reputation: 10 },
    explanation: 'Suspeitas de fraude fiscal devem ser investigadas pela auditoria interna com rigor, preservando sigilo e evitando alertar o suspeito antes da apuração.'
  },
  {
    id: 'case-4',
    report: 'Funcionário relata que dados pessoais de clientes estão sendo acessados sem necessidade por diversos colaboradores.',
    options: [
      'Solicitar lista de nomes dos colaboradores',
      'Ignorar, pois é acesso interno',
      'Orientar o funcionário a falar com seu gestor',
      'Encaminhar ao DPO e Compliance para verificação urgente'
    ],
    idealIndex: 3,
    impacts: { trust: 20, risk: -35, reputation: 25 },
    explanation: 'Acesso indevido a dados pessoais viola a LGPD e deve ser tratado com urgência pelo DPO e Compliance, com auditoria de acessos e medidas corretivas imediatas.'
  },
  {
    id: 'case-5',
    report: 'Denúncia de discriminação: colaboradora relata não ter sido promovida devido ao seu gênero, enquanto colegas homens menos qualificados foram promovidos.',
    options: [
      'Recomendar que a colaboradora busque advogado',
      'Orientar a colaboradora a conversar com RH informalmente',
      'Arquivar se não houver testemunhas',
      'Encaminhar ao RH e Compliance para análise de processos seletivos'
    ],
    idealIndex: 3,
    impacts: { trust: 25, risk: -30, reputation: 20 },
    explanation: 'Discriminação de gênero é grave e ilegal. Requer investigação formal do RH e Compliance, com análise de processos de promoção e possíveis medidas corretivas.'
  },
  {
    id: 'case-6',
    report: 'Relato de conflito de interesses: gerente possui participação societária em empresa fornecedora sem ter declarado formalmente.',
    options: [
      'Pedir ao gerente que venda suas ações',
      'Alertar apenas o superior imediato',
      'Encaminhar ao Compliance para investigação e aplicação de políticas',
      'Ignorar se o trabalho dele é bom'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Conflito de interesses não declarado compromete a imparcialidade. Deve ser investigado pelo Compliance com aplicação das políticas de conflito de interesses.'
  },
  {
    id: 'case-7',
    report: 'Denúncia de vazamento de informações confidenciais da empresa para concorrentes por colaborador do setor comercial.',
    options: [
      'Demitir o colaborador imediatamente',
      'Alertar apenas a liderança comercial',
      'Monitorar o colaborador discretamente',
      'Encaminhar ao Compliance e TI para investigação urgente com análise de logs'
    ],
    idealIndex: 3,
    impacts: { trust: 15, risk: -40, reputation: 10 },
    explanation: 'Vazamento de informações confidenciais é grave. Requer investigação urgente com análise técnica de logs, preservação de evidências e possíveis medidas legais.'
  },
  {
    id: 'case-8',
    report: 'Funcionário relata irregularidades contábeis: notas fiscais sendo emitidas sem correspondência com serviços realmente prestados.',
    options: [
      'Pedir ao funcionário para reunir mais provas primeiro',
      'Consultar o departamento financeiro sobre os procedimentos',
      'Encaminhar imediatamente à auditoria interna e Compliance',
      'Aguardar auditoria externa de rotina'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -35, reputation: 25 },
    explanation: 'Irregularidades fiscais são graves e podem configurar crime. Devem ser investigadas imediatamente pela auditoria interna com rigor e sigilo.'
  },
  {
    id: 'case-9',
    report: 'Denúncia de assédio sexual: colaboradora relata abordagens e comentários inadequados de superior hierárquico.',
    options: [
      'Aguardar se há outras denúncias similares',
      'Sugerir transferência da colaboradora para outro setor',
      'Encaminhar ao RH e Compliance com medidas de proteção imediatas',
      'Orientar a colaboradora a evitar o assediador'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -35, reputation: 25 },
    explanation: 'Assédio sexual é crime e requer ação imediata. Deve ser encaminhado ao RH e Compliance com proteção à vítima, afastamento cautelar do agressor e investigação rigorosa.'
  },
  {
    id: 'case-10',
    report: 'Relato de manipulação de indicadores de performance para ocultar metas não atingidas pela equipe.',
    options: [
      'Arquivar se não houve prejuízo financeiro',
      'Alertar apenas o gestor responsável',
      'Ignorar se as metas foram ajustadas depois',
      'Encaminhar ao Compliance para verificação de dados e processos'
    ],
    idealIndex: 3,
    impacts: { trust: 15, risk: -20, reputation: 10 },
    explanation: 'Manipulação de indicadores compromete a transparência e pode mascarar problemas graves. Deve ser investigada pelo Compliance com análise de dados e processos.'
  },
  {
    id: 'case-11',
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
    id: 'case-12',
    report: 'Colaborador relata que foi pressionado a falsificar relatórios de segurança para acelerar aprovação de projeto.',
    options: [
      'Alertar apenas o superior do solicitante',
      'Arquivar se ninguém se machucou',
      'Encaminhar urgentemente ao Compliance e Segurança do Trabalho',
      'Pedir ao colaborador para reunir evidências primeiro'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -45, reputation: 20 },
    explanation: 'Falsificação de relatórios de segurança coloca vidas em risco e é crime. Requer investigação urgente pelo Compliance e autoridades de segurança do trabalho.'
  },
  {
    id: 'case-13',
    report: 'Denúncia de favorecimento: gestor sempre escolhe a mesma empresa fornecedora mesmo quando há propostas mais vantajosas.',
    options: [
      'Investigar se há relação pessoal entre gestor e fornecedor',
      'Aceitar se a qualidade do fornecedor é boa',
      'Encaminhar ao Compliance para auditoria de processos de compra',
      'Sugerir rotação de fornecedores'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -28, reputation: 12 },
    explanation: 'Favorecimento sistemático pode indicar corrupção ou conflito de interesses. Compliance deve auditar processos de compra e investigar possíveis irregularidades.'
  },
  {
    id: 'case-14',
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
    id: 'case-15',
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
    id: 'case-16',
    report: 'Relato de insider trading: executivo repassou informações privilegiadas sobre fusão a investidores externos.',
    options: [
      'Monitorar transações do executivo',
      'Encaminhar ao Compliance e CVM com análise de movimentações financeiras',
      'Advertir o executivo verbalmente',
      'Consultar o departamento jurídico'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -42, reputation: 18 },
    explanation: 'Insider trading é crime contra o mercado de capitais. Deve ser investigado pelo Compliance com comunicação à CVM e análise de movimentações financeiras suspeitas.'
  },
  {
    id: 'case-17',
    report: 'Denúncia de racismo: colaborador negro relata ofensas raciais sistemáticas de colegas de equipe.',
    options: [
      'Orientar o colaborador a registrar boletim de ocorrência',
      'Encaminhar urgentemente ao RH e Compliance com proteção à vítima',
      'Promover palestra sobre diversidade para a equipe',
      'Transferir o colaborador para outro setor'
    ],
    idealIndex: 1,
    impacts: { trust: 30, risk: -35, reputation: 25 },
    explanation: 'Racismo é crime inafiançável. Requer investigação urgente pelo RH e Compliance, proteção à vítima, medidas disciplinares e possível ação judicial.'
  },
  {
    id: 'case-18',
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
    id: 'case-19',
    report: 'Denúncia de assédio eleitoral: gestor pressiona equipe a votar em determinado candidato político.',
    options: [
      'Alertar o gestor sobre ilegalidade',
      'Encaminhar ao Compliance e considerar denúncia ao Ministério Público Eleitoral',
      'Ignorar após período eleitoral',
      'Orientar colaboradores a ignorarem'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Assédio eleitoral é crime eleitoral. Deve ser encaminhado ao Compliance e pode exigir denúncia ao Ministério Público Eleitoral conforme gravidade.'
  },
  {
    id: 'case-20',
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
    id: 'case-21',
    report: 'Denúncia de fraude em licitação: empresa está combinando propostas com concorrentes para manipular resultado.',
    options: [
      'Encaminhar ao Compliance e TCU/CGU conforme esfera de governo',
      'Desclassificar todas as propostas suspeitas',
      'Refazer a licitação sem investigar',
      'Aceitar a proposta mais vantajosa dentre as suspeitas'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -45, reputation: 25 },
    explanation: 'Fraude em licitação é crime contra a administração pública. Deve ser investigada pelo Compliance e comunicada aos órgãos de controle (TCU/CGU).'
  },
  {
    id: 'case-22',
    report: 'Funcionário relata que prontuários médicos estão sendo alterados para ocultar erros médicos graves.',
    options: [
      'Alertar apenas a diretoria médica',
      'Fazer cópia dos prontuários alterados',
      'Encaminhar urgentemente ao Compliance, CRM e autoridades sanitárias',
      'Aguardar se pacientes reclamarem'
    ],
    idealIndex: 2,
    impacts: { trust: 32, risk: -50, reputation: 35 },
    explanation: 'Alteração de prontuários para ocultar erros é crime gravíssimo. Requer investigação urgente pelo Compliance, CRM e possível comunicação ao Ministério Público.'
  },
  {
    id: 'case-23',
    report: 'Denúncia de assédio religioso: colaboradora é constantemente pressionada a participar de cultos da religião de seu gestor.',
    options: [
      'Sugerir que a colaboradora participe para manter harmonia',
      'Encaminhar ao RH e Compliance para proteção dos direitos constitucionais',
      'Transferir a colaboradora para outro setor',
      'Orientar sobre liberdade religiosa informalmente'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Assédio religioso viola direitos constitucionais. Deve ser investigado pelo RH e Compliance com proteção à vítima e medidas disciplinares cabíveis.'
  },
  {
    id: 'case-24',
    report: 'Relato de superfaturamento: empresa terceirizada está cobrando por serviços não prestados há meses.',
    options: [
      'Solicitar justificativa à terceirizada',
      'Reter pagamento até esclarecimentos',
      'Encaminhar ao Compliance e Auditoria para investigação e recuperação de valores',
      'Rescindir contrato sem investigar'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -35, reputation: 15 },
    explanation: 'Superfaturamento configura fraude. Compliance e Auditoria devem investigar, quantificar danos, recuperar valores e considerar medidas legais.'
  },
  {
    id: 'case-25',
    report: 'Denúncia de uso indevido de ambulâncias: veículos hospitalares sendo usados para transporte particular de diretores.',
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
    id: 'case-26',
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
    id: 'case-27',
    report: 'Denúncia de apropriação indébita: tesoureiro está desviando recursos de fundo assistencial dos funcionários.',
    options: [
      'Solicitar prestação de contas',
      'Encaminhar ao Compliance e considerar ação criminal',
      'Afastar o tesoureiro temporariamente',
      'Fazer auditoria interna primeiro'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -40, reputation: 20 },
    explanation: 'Apropriação indébita é crime patrimonial. Compliance deve investigar com rigor, preservar evidências e encaminhar ao Jurídico para possível ação criminal.'
  },
  {
    id: 'case-28',
    report: 'Relato de discriminação por idade: candidatos acima de 50 anos são sistematicamente rejeitados em processos seletivos.',
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
    id: 'case-29',
    report: 'Denúncia de terrorismo psicológico: gestor ameaça constantemente equipe com demissões arbitrárias e humilhações.',
    options: [
      'Orientar equipe a procurar sindicato',
      'Encaminhar ao RH e Compliance para investigação de assédio moral coletivo',
      'Promover mediação entre gestor e equipe',
      'Transferir colaboradores para outros setores'
    ],
    idealIndex: 1,
    impacts: { trust: 28, risk: -32, reputation: 22 },
    explanation: 'Assédio moral coletivo é grave e ilegal. RH e Compliance devem investigar urgentemente, proteger vítimas e aplicar medidas disciplinares severas.'
  },
  {
    id: 'case-30',
    report: 'Funcionário relata que equipamentos médicos vencidos estão sendo reembalados e usados em procedimentos.',
    options: [
      'Fazer inventário de validades',
      'Encaminhar urgentemente ao Compliance, ANVISA e autoridades sanitárias',
      'Orientar equipe sobre verificação de validades',
      'Descartar equipamentos vencidos'
    ],
    idealIndex: 1,
    impacts: { trust: 32, risk: -52, reputation: 38 },
    explanation: 'Uso de equipamentos vencidos é crime sanitário gravíssimo que coloca vidas em risco. Requer ação imediata com Compliance e comunicação à ANVISA.'
  },
  {
    id: 'case-31',
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
    id: 'case-32',
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
    id: 'case-33',
    report: 'Denúncia de violação de sigilo: funcionário está vendendo informações sobre pacientes VIPs para tabloides.',
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
    id: 'case-34',
    report: 'Funcionário relata que colegas estão consumindo bebidas alcoólicas durante expediente em área hospitalar.',
    options: [
      'Advertir verbalmente os envolvidos',
      'Encaminhar ao RH e Compliance com teste toxicológico e medidas disciplinares',
      'Ignorar se não afeta atendimento',
      'Proibir álcool nas dependências'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -35, reputation: 18 },
    explanation: 'Consumo de álcool em ambiente hospitalar compromete segurança do paciente. RH e Compliance devem investigar, testar e aplicar medidas disciplinares.'
  },
  {
    id: 'case-35',
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
    id: 'case-36',
    report: 'Relato de discriminação por orientação sexual: colaborador LGBT+ é constantemente alvo de piadas ofensivas.',
    options: [
      'Promover palestra sobre diversidade',
      'Encaminhar ao RH e Compliance para proteção e investigação de LGBTfobia',
      'Orientar o colaborador a ignorar',
      'Transferir o colaborador para área mais inclusiva'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'LGBTfobia é crime equiparado ao racismo. RH e Compliance devem investigar urgentemente, proteger a vítima e aplicar medidas disciplinares severas.'
  },
  {
    id: 'case-37',
    report: 'Denúncia de uso de medicamentos falsificados: farmácia hospitalar pode estar adquirindo remédios de origem duvidosa.',
    options: [
      'Verificar documentação dos fornecedores',
      'Encaminhar urgentemente ao Compliance, ANVISA e polícia',
      'Fazer análise laboratorial dos medicamentos',
      'Trocar de fornecedor'
    ],
    idealIndex: 1,
    impacts: { trust: 35, risk: -58, reputation: 42 },
    explanation: 'Uso de medicamentos falsificados é crime hediondo que coloca vidas em risco. Requer ação imediata com Compliance, ANVISA e autoridades policiais.'
  },
  {
    id: 'case-38',
    report: 'Funcionário relata que gestor está coagindo subordinados a fazerem "vaquinha" para presentes caros para diretoria.',
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
    id: 'case-39',
    report: 'Denúncia de negligência médica: médico está atendendo sob efeito de medicamentos controlados que afetam cognição.',
    options: [
      'Afastar o médico cautelarmente',
      'Encaminhar urgentemente ao Compliance, CRM e considerar afastamento',
      'Conversar com o médico sobre o problema',
      'Reduzir carga horária do médico'
    ],
    idealIndex: 1,
    impacts: { trust: 32, risk: -48, reputation: 35 },
    explanation: 'Exercício da medicina sob efeito de substâncias que afetam cognição coloca vidas em risco. Requer afastamento imediato e investigação pelo CRM.'
  },
  {
    id: 'case-40',
    report: 'Relato de dumping social: empresa terceirizada não está pagando direitos trabalhistas de funcionários alocados.',
    options: [
      'Reter pagamentos até regularização',
      'Encaminhar ao Compliance e Jurídico para auditoria trabalhista e rescisão',
      'Notificar a terceirizada formalmente',
      'Assumir pagamento dos direitos'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -32, reputation: 18 },
    explanation: 'Dumping social viola direitos trabalhistas e pode gerar responsabilidade solidária. Compliance deve auditar, exigir regularização ou rescindir contrato.'
  },
  {
    id: 'case-41',
    report: 'Denúncia de favoritismo em promoções: apenas funcionários próximos ao diretor são promovidos, independente de meritocracia.',
    options: [
      'Estabelecer critérios claros de promoção',
      'Encaminhar ao RH e Compliance para revisão de processos de carreira',
      'Aceitar se os promovidos são competentes',
      'Criar comitê de promoções'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -25, reputation: 15 },
    explanation: 'Favoritismo em promoções viola princípios de meritocracia e imparcialidade. RH e Compliance devem revisar processos e estabelecer critérios objetivos.'
  },
  {
    id: 'case-42',
    report: 'Funcionário relata que resíduos químicos perigosos estão sendo descartados em rede de esgoto comum.',
    options: [
      'Contratar empresa especializada em descarte',
      'Encaminhar urgentemente ao Compliance e órgãos ambientais',
      'Treinar equipe sobre descarte correto',
      'Construir área de armazenamento temporário'
    ],
    idealIndex: 1,
    impacts: { trust: 28, risk: -42, reputation: 32 },
    explanation: 'Descarte inadequado de resíduos químicos é crime ambiental grave. Requer ação imediata com Compliance e comunicação aos órgãos ambientais competentes.'
  },
  {
    id: 'case-43',
    report: 'Denúncia de censura: funcionários são proibidos de relatar problemas de qualidade por medo de retaliação.',
    options: [
      'Fortalecer canal de denúncias anônimo',
      'Encaminhar ao Compliance para investigação de clima organizacional e retaliação',
      'Promover cultura de transparência',
      'Treinar gestores sobre feedback'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -28, reputation: 18 },
    explanation: 'Clima de censura e retaliação compromete qualidade e segurança. Compliance deve investigar, proteger whistleblowers e promover cultura de transparência.'
  },
  {
    id: 'case-44',
    report: 'Relato de fraude em ponto eletrônico: grupo de funcionários está registrando presença uns dos outros sem estar no trabalho.',
    options: [
      'Advertir os funcionários envolvidos',
      'Encaminhar ao RH e Compliance para auditoria de jornada e medidas disciplinares',
      'Implementar biometria facial',
      'Aumentar fiscalização presencial'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -25, reputation: 12 },
    explanation: 'Fraude em ponto eletrônico configura falta grave e pode gerar demissão por justa causa. RH e Compliance devem auditar, provar fraude e aplicar sanções.'
  },
  {
    id: 'case-45',
    report: 'Denúncia de assédio processual: gestor está abrindo processos administrativos vexatórios contra subordinados que o criticam.',
    options: [
      'Revisar processos abertos pelo gestor',
      'Encaminhar ao RH e Compliance para investigação de abuso de poder',
      'Orientar subordinados sobre direitos',
      'Criar comissão de sindicância'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -28, reputation: 15 },
    explanation: 'Assédio processual é abuso de poder e forma de retaliação. RH e Compliance devem investigar processos, proteger vítimas e aplicar medidas disciplinares.'
  },
  {
    id: 'case-46',
    report: 'Funcionário relata que dados de pesquisas de satisfação estão sendo manipulados antes de apresentação à diretoria.',
    options: [
      'Solicitar dados brutos originais',
      'Encaminhar ao Compliance para auditoria de dados e transparência',
      'Contratar pesquisa externa independente',
      'Revisar metodologia de pesquisa'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -22, reputation: 12 },
    explanation: 'Manipulação de dados compromete tomada de decisão e pode mascarar problemas graves. Compliance deve auditar dados e garantir transparência nas informações.'
  },
  {
    id: 'case-47',
    report: 'Denúncia de facilitação de fraude: profissional de TI está fornecendo acessos privilegiados indevidos mediante pagamento.',
    options: [
      'Revogar todos os acessos criados',
      'Encaminhar ao Compliance e TI para investigação criminal de corrupção',
      'Afastar o profissional temporariamente',
      'Auditar todos os sistemas'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -45, reputation: 20 },
    explanation: 'Venda de acessos privilegiados é corrupção grave e compromete segurança da informação. Compliance deve investigar com rigor e considerar ação criminal.'
  },
  {
    id: 'case-48',
    report: 'Relato de violência obstétrica: médico está realizando procedimentos desnecessários e dolorosos sem consentimento de parturientes.',
    options: [
      'Alertar o médico sobre protocolos',
      'Encaminhar urgentemente ao Compliance, CRM e MPF',
      'Treinar equipe sobre parto humanizado',
      'Oferecer segunda opinião às pacientes'
    ],
    idealIndex: 1,
    impacts: { trust: 35, risk: -50, reputation: 40 },
    explanation: 'Violência obstétrica é crime e viola direitos humanos. Requer investigação urgente pelo CRM, Compliance e possível ação pelo Ministério Público Federal.'
  },
  {
    id: 'case-49',
    report: 'Denúncia de cartel: empresas concorrentes estão combinando preços em contratos com hospital, elevando custos artificialmente.',
    options: [
      'Renegociar preços',
      'Encaminhar ao Compliance e CADE para investigação de formação de cartel',
      'Buscar novos fornecedores',
      'Fazer licitação mais ampla'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -38, reputation: 18 },
    explanation: 'Formação de cartel é crime contra a ordem econômica. Compliance deve coletar evidências e comunicar ao CADE para investigação e possível ação antitruste.'
  },
  {
    id: 'case-50',
    report: 'Funcionário relata que certificados e diplomas falsos estão sendo aceitos em processos seletivos sem verificação adequada.',
    options: [
      'Implementar verificação de diplomas',
      'Encaminhar ao RH e Compliance para auditoria de documentação e revisão de contratações',
      'Treinar RH sobre validação de documentos',
      'Exigir apostilamento de diplomas'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Aceitação de diplomas falsos compromete qualidade e segurança. RH e Compliance devem auditar contratações, validar documentos e revisar processos seletivos.'
  }
];

// Dados do Jogo 6 - Compliance Tycoon
export const complianceActions: ComplianceAction[] = [
  {
    id: 'action-1',
    name: 'Treinamento em Massa',
    description: 'Realizar treinamento de ética e compliance para todos os colaboradores',
    budgetCost: 30,
    timeCost: 20,
    effects: {
      compliance: 15,
      reputation: 5,
      engagement: 20,
      maturity: 10
    }
  },
  {
    id: 'action-2',
    name: 'Revisar Código de Ética',
    description: 'Atualizar e modernizar o Código de Ética da organização',
    budgetCost: 20,
    timeCost: 25,
    effects: {
      compliance: 10,
      reputation: 15,
      engagement: 10,
      maturity: 15
    }
  },
  {
    id: 'action-3',
    name: 'Auditoria de Contratos',
    description: 'Realizar auditoria completa dos contratos com fornecedores',
    budgetCost: 40,
    timeCost: 30,
    effects: {
      compliance: 25,
      reputation: 10,
      engagement: 5,
      maturity: 20
    }
  },
  {
    id: 'action-4',
    name: 'Fortalecer Canal de Denúncias',
    description: 'Melhorar infraestrutura e divulgação do canal de denúncias',
    budgetCost: 25,
    timeCost: 15,
    effects: {
      compliance: 20,
      reputation: 20,
      engagement: 15,
      maturity: 15
    }
  },
  {
    id: 'action-5',
    name: 'Implementar Controles',
    description: 'Criar controles adicionais para prevenção de fraudes',
    budgetCost: 35,
    timeCost: 25,
    effects: {
      compliance: 30,
      reputation: 10,
      engagement: 5,
      maturity: 25
    }
  },
  {
    id: 'action-6',
    name: 'Programa de Integridade',
    description: 'Estruturar programa de integridade conforme lei anticorrupção',
    budgetCost: 50,
    timeCost: 40,
    effects: {
      compliance: 35,
      reputation: 25,
      engagement: 15,
      maturity: 30
    }
  },
  {
    id: 'action-7',
    name: 'Due Diligence Fornecedores',
    description: 'Implementar processo de due diligence em fornecedores',
    budgetCost: 30,
    timeCost: 20,
    effects: {
      compliance: 20,
      reputation: 15,
      engagement: 5,
      maturity: 20
    }
  },
  {
    id: 'action-8',
    name: 'Workshop de LGPD',
    description: 'Capacitar equipes sobre proteção de dados e LGPD',
    budgetCost: 25,
    timeCost: 15,
    effects: {
      compliance: 15,
      reputation: 10,
      engagement: 15,
      maturity: 15
    }
  }
];
