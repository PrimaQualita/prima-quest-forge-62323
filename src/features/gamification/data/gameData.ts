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

// Dados do Jogo 5 - Canal de Denúncias
export const whistleblowerCases: WhistleblowerCase[] = [
  {
    id: 'case-1',
    report: 'Denúncia anônima relata que um gestor está solicitando vantagens financeiras de fornecedores para favorecer contratos.',
    options: [
      'Arquivar por falta de provas',
      'Solicitar mais informações ao denunciante',
      'Encaminhar imediatamente ao Compliance para investigação',
      'Confrontar o gestor diretamente'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -30, reputation: 15 },
    explanation: 'Denúncias de corrupção devem ser encaminhadas imediatamente ao Compliance para investigação formal, preservando sigilo e evitando confrontos que possam comprometer evidências.'
  },
  {
    id: 'case-2',
    report: 'Relato de assédio moral: funcionário afirma sofrer humilhações públicas constantes de sua liderança imediata.',
    options: [
      'Pedir ao funcionário para resolver diretamente',
      'Encaminhar ao RH e Compliance para investigação urgente',
      'Aguardar mais relatos para confirmar',
      'Aconselhar o funcionário a procurar outro emprego'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -25, reputation: 20 },
    explanation: 'Assédio moral é grave e requer investigação urgente. Deve ser encaminhado ao RH e Compliance, com proteção ao denunciante e medidas cautelares se necessário.'
  },
  {
    id: 'case-3',
    report: 'Denúncia de possível fraude em notas fiscais de despesas de viagens corporativas.',
    options: [
      'Solicitar ao denunciante mais detalhes e evidências',
      'Encaminhar para auditoria interna investigar',
      'Alertar o suspeito para se explicar',
      'Arquivar se não houver provas concretas'
    ],
    idealIndex: 1,
    impacts: { trust: 15, risk: -20, reputation: 10 },
    explanation: 'Suspeitas de fraude fiscal devem ser investigadas pela auditoria interna com rigor, preservando sigilo e evitando alertar o suspeito antes da apuração.'
  },
  {
    id: 'case-4',
    report: 'Funcionário relata que dados pessoais de clientes estão sendo acessados sem necessidade por diversos colaboradores.',
    options: [
      'Orientar o funcionário a falar com seu gestor',
      'Encaminhar ao DPO e Compliance para verificação urgente',
      'Ignorar, pois é acesso interno',
      'Solicitar lista de nomes dos colaboradores'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -35, reputation: 25 },
    explanation: 'Acesso indevido a dados pessoais viola a LGPD e deve ser tratado com urgência pelo DPO e Compliance, com auditoria de acessos e medidas corretivas imediatas.'
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
