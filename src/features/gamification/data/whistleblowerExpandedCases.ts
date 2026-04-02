import { WhistleblowerCase } from '../types';
import { shuffleArray } from './expandedQuestions';

/**
 * 80 Casos para o jogo Canal de Denúncias
 * Questões com respostas não óbvias, exigindo conhecimento real de compliance
 * Os índices corretos variam entre todas as posições (0-3)
 */
export const expandedWhistleblowerCases: WhistleblowerCase[] = [
  {
    id: 'case-1',
    report: 'Funcionário relata que planilhas com salários de todos os funcionários foram compartilhadas em grupo de WhatsApp.',
    options: [
      'Identificar quem compartilhou',
      'Apagar mensagens do grupo',
      'Encaminhar ao DPO e Compliance para investigação de vazamento',
      'Alertar sobre confidencialidade'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -30, reputation: 20 },
    explanation: 'Vazamento de dados salariais é incidente de segurança da informação. O DPO precisa avaliar o impacto sob a LGPD e o Compliance deve investigar a origem e adotar medidas corretivas formais, não apenas ações informais.'
  },
  {
    id: 'case-2',
    report: 'Colaborador percebe que seu gestor aprova despesas de viagem sem conferir comprovantes, confiando na "palavra" dos subordinados.',
    options: [
      'Sugerir que o gestor passe a conferir comprovantes',
      'Registrar a situação no canal de denúncias para auditoria interna',
      'Não reportar pois não há fraude comprovada',
      'Conversar com o gestor sobre o risco'
    ],
    idealIndex: 1,
    impacts: { trust: 15, risk: -20, reputation: 10 },
    explanation: 'Mesmo sem fraude comprovada, a ausência de controle é uma vulnerabilidade. Registrar no canal permite que a auditoria avalie o processo e implemente controles preventivos.'
  },
  {
    id: 'case-3',
    report: 'Funcionário relata que informações sobre pacientes VIPs estão sendo vendidas para tabloides.',
    options: [
      'Restringir acessos do funcionário suspeito',
      'Demitir por justa causa imediatamente',
      'Alertar os pacientes afetados',
      'Encaminhar ao Compliance, Jurídico e autoridades com análise de acessos'
    ],
    idealIndex: 3,
    impacts: { trust: 30, risk: -45, reputation: 35 },
    explanation: 'Venda de dados sensíveis de saúde é crime. É necessário envolver Compliance, Jurídico e autoridades, além de fazer análise forense dos acessos para identificar o responsável antes de tomar medidas precipitadas.'
  },
  {
    id: 'case-4',
    report: 'Um fornecedor oferece ingressos VIP para a Copa do Mundo ao comprador da empresa, sem nenhuma contrapartida explícita.',
    options: [
      'Aceitar pois não há contrapartida solicitada',
      'Recusar educadamente e registrar o ocorrido conforme política de brindes',
      'Aceitar e compartilhar com a equipe',
      'Denunciar o fornecedor às autoridades'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -15, reputation: 15 },
    explanation: 'Mesmo sem contrapartida explícita, presentes de alto valor podem configurar tentativa de influência. A política de brindes da empresa deve ser seguida, recusando e registrando formalmente.'
  },
  {
    id: 'case-5',
    report: 'Colaborador descobre que o sistema de ponto eletrônico permite que gestores alterem registros de horário dos subordinados.',
    options: [
      'Reportar à TI para correção da vulnerabilidade e ao Compliance para auditoria',
      'Verificar se gestores estão de fato alterando',
      'Não reportar pois é funcionalidade do sistema',
      'Pedir ao RH que monitore as alterações'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -25, reputation: 18 },
    explanation: 'A vulnerabilidade no sistema permite fraude trabalhista. TI deve corrigir a falha e Compliance deve auditar se houve alterações indevidas, mesmo que não haja evidência imediata de uso.'
  },
  {
    id: 'case-6',
    report: 'Funcionária descobre que seu colega está usando a impressora da empresa para imprimir material de campanha política.',
    options: [
      'Ignorar por ser algo pequeno',
      'Alertar o colega que isso não é permitido',
      'Reportar ao gestor imediato como uso indevido de recurso corporativo',
      'Denunciar ao Ministério Público Eleitoral'
    ],
    idealIndex: 2,
    impacts: { trust: 12, risk: -10, reputation: 10 },
    explanation: 'Uso de recursos corporativos para fins político-partidários viola políticas internas e pode configurar irregularidade eleitoral. O gestor imediato deve ser informado para correção proporcional.'
  },
  {
    id: 'case-7',
    report: 'Denúncia anônima relata que um gerente está contratando familiares para cargos temporários sem processo seletivo.',
    options: [
      'Verificar se os familiares são qualificados para os cargos',
      'Solicitar ao RH revisão dos contratos com análise de conflito de interesse',
      'Cancelar todos os contratos temporários',
      'Confrontar o gerente sobre a prática'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -22, reputation: 18 },
    explanation: 'Contratação de familiares sem processo seletivo configura nepotismo e conflito de interesse. O RH deve revisar os contratos e Compliance deve avaliar se houve violação de política, independente da qualificação.'
  },
  {
    id: 'case-8',
    report: 'Funcionário percebe que dados de cartão de crédito de clientes ficam visíveis na tela do sistema de atendimento por tempo indeterminado.',
    options: [
      'Reportar à TI como vulnerabilidade de segurança para correção urgente',
      'Minimizar a tela quando não estiver usando',
      'Aguardar a próxima atualização do sistema',
      'Informar ao gestor para que oriente a equipe'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'Exposição de dados de cartão viola PCI-DSS e LGPD. É uma vulnerabilidade técnica que deve ser corrigida urgentemente pela TI, não apenas mitigada com práticas manuais.'
  },
  {
    id: 'case-9',
    report: 'Colaborador relata que a empresa não está recolhendo FGTS há 3 meses, apesar de descontar dos funcionários.',
    options: [
      'Verificar com o financeiro se há atraso no pagamento',
      'Orientar o colaborador a consultar o extrato do FGTS',
      'Registrar no canal de denúncias e encaminhar para auditoria trabalhista',
      'Aguardar o próximo ciclo de pagamento'
    ],
    idealIndex: 2,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'Retenção de FGTS é infração trabalhista grave e pode configurar apropriação indébita. Deve ser formalizado por canal oficial para garantir investigação e regularização.'
  },
  {
    id: 'case-10',
    report: 'Funcionário descobre que relatórios de auditoria interna estão sendo alterados antes de serem apresentados à diretoria.',
    options: [
      'Guardar cópias originais como evidência',
      'Confrontar o auditor responsável',
      'Reportar diretamente ao Conselho de Administração ou Comitê de Auditoria',
      'Informar ao diretor financeiro'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -45, reputation: 30 },
    explanation: 'Adulteração de relatórios de auditoria compromete toda a governança. Deve ser reportado ao nível mais alto de governança (Conselho/Comitê de Auditoria), pois a gestão pode estar envolvida.'
  },
  {
    id: 'case-11',
    report: 'Colaborador percebe que a empresa está classificando funcionários como PJ para evitar encargos trabalhistas, mas eles trabalham com subordinação e horário fixo.',
    options: [
      'Não se envolver pois não é problema seu',
      'Sugerir ao RH que revise os contratos',
      'Reportar ao Compliance como possível fraude à legislação trabalhista',
      'Orientar os PJs sobre seus direitos'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'A "pejotização" com subordinação e habitualidade configura fraude trabalhista. Compliance deve avaliar para mitigar riscos legais significativos para a empresa.'
  },
  {
    id: 'case-12',
    report: 'Funcionário de TI descobre que o backup de dados não está sendo feito há 6 meses por falha no sistema automatizado.',
    options: [
      'Corrigir o backup manualmente e informar ao gestor de TI',
      'Documentar a falha e reportar formalmente à gestão de riscos e TI',
      'Não reportar para não gerar pânico',
      'Aguardar a manutenção programada do sistema'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -40, reputation: 18 },
    explanation: 'Falha em backup por 6 meses é risco crítico de continuidade. Além de corrigir tecnicamente, deve ser reportado formalmente à gestão de riscos para avaliação de impacto e plano de contingência.'
  },
  {
    id: 'case-13',
    report: 'Colaborador relata que medicamentos controlados estão sendo descartados sem registro formal, contrariando normas da ANVISA.',
    options: [
      'Orientar sobre procedimento correto de descarte',
      'Registrar no canal e encaminhar ao Compliance e Farmácia para apuração e regularização',
      'Interromper descartes até nova orientação',
      'Comunicar diretamente à ANVISA'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -42, reputation: 25 },
    explanation: 'Descarte irregular de medicamentos controlados viola normas sanitárias e pode ter implicações criminais. Compliance e a área responsável devem apurar e implementar controles antes de comunicar ao regulador.'
  },
  {
    id: 'case-14',
    report: 'Funcionário percebe que o Wi-Fi corporativo não tem segmentação: visitantes acessam a mesma rede que contém dados sensíveis.',
    options: [
      'Sugerir à TI que crie uma rede separada para visitantes',
      'Reportar como vulnerabilidade de segurança à TI e ao DPO',
      'Não usar o Wi-Fi para dados sensíveis',
      'Pedir aos visitantes que usem dados móveis'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -30, reputation: 15 },
    explanation: 'Ausência de segmentação de rede é vulnerabilidade séria que expõe dados sensíveis. Deve ser reportado formalmente à TI e ao DPO, não apenas sugerido informalmente.'
  },
  {
    id: 'case-15',
    report: 'Colaborador descobre que contratos com fornecedores estão sendo renovados automaticamente sem reavaliação de preços ou qualidade.',
    options: [
      'Renegociar preços diretamente com fornecedores',
      'Reportar ao Compliance e área de compras para revisão dos processos de contratação',
      'Não é problema pois a renovação é legal',
      'Aguardar o ciclo orçamentário para revisão'
    ],
    idealIndex: 1,
    impacts: { trust: 15, risk: -18, reputation: 12 },
    explanation: 'Renovação automática sem reavaliação pode gerar desperdício e favoritismo. O processo deve ser auditado pelo Compliance e área de compras para garantir competitividade e transparência.'
  },
  {
    id: 'case-16',
    report: 'Funcionário de RH percebe que avaliações de desempenho de uma equipe foram todas preenchidas pelo gestor sem consultar os avaliados.',
    options: [
      'Invalidar as avaliações e refazer',
      'Comunicar ao RH e Compliance como fraude no processo de avaliação',
      'Orientar o gestor sobre o processo correto',
      'Aceitar pois o gestor conhece bem sua equipe'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -15, reputation: 15 },
    explanation: 'Avaliações fraudadas comprometem a gestão de pessoas e podem encobrir problemas. Deve ser comunicado formalmente para invalidação e investigação de possível motivação.'
  },
  {
    id: 'case-17',
    report: 'Colaborador descobre que a empresa está usando software pirata em estações de trabalho para "reduzir custos".',
    options: [
      'Orientar a TI a regularizar as licenças',
      'Ignorar pois é decisão da gestão',
      'Reportar ao Compliance como violação de propriedade intelectual e risco legal',
      'Substituir por software gratuito equivalente'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -30, reputation: 20 },
    explanation: 'Uso de software pirata é crime contra propriedade intelectual e expõe a empresa a multas pesadas. Compliance deve ser envolvido para regularização e avaliação de responsabilidades.'
  },
  {
    id: 'case-18',
    report: 'Funcionário relata que documentos de rescisão de ex-funcionários estão sendo armazenados sem prazo definido de retenção, incluindo dados sensíveis.',
    options: [
      'Destruir todos os documentos antigos imediatamente',
      'Solicitar ao DPO a definição de política de retenção conforme LGPD',
      'Manter tudo guardado por segurança jurídica',
      'Digitalizar e destruir os físicos'
    ],
    idealIndex: 1,
    impacts: { trust: 15, risk: -20, reputation: 12 },
    explanation: 'A LGPD exige que dados pessoais tenham prazo de retenção definido. O DPO deve estabelecer política baseada em obrigações legais trabalhistas e fiscais, equilibrando necessidade de guarda com minimização de dados.'
  },
  {
    id: 'case-19',
    report: 'Colaborador percebe que o sistema de CFTV grava áreas de descanso e vestiários dos funcionários.',
    options: [
      'Cobrir as câmeras nesses ambientes',
      'Reportar ao DPO e Compliance como violação de privacidade para remoção e apuração',
      'Verificar se há aviso sobre as câmeras',
      'Orientar funcionários a usar outros espaços'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -35, reputation: 25 },
    explanation: 'Câmeras em vestiários e áreas de descanso violam direito à privacidade e intimidade (art. 5° CF). DPO e Compliance devem remover câmeras, apurar quem autorizou e verificar se imagens foram acessadas.'
  },
  {
    id: 'case-20',
    report: 'Funcionário descobre que a empresa divulga lista de devedores inadimplentes em mural público na recepção.',
    options: [
      'Sugerir que use meios privados de cobrança',
      'Retirar a lista imediatamente',
      'Reportar ao Compliance e DPO como exposição indevida de dados e cobrança vexatória',
      'Verificar se há autorização dos clientes'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -30, reputation: 25 },
    explanation: 'Exposição pública de devedores configura cobrança vexatória (CDC) e violação da LGPD. Compliance e DPO devem atuar para cessar a prática e avaliar danos aos titulares.'
  },
  {
    id: 'case-21',
    report: 'Colaborador percebe que um colega está vendendo materiais de escritório da empresa em marketplace online.',
    options: [
      'Confrontar o colega diretamente',
      'Comprar os materiais para devolver à empresa',
      'Registrar no canal de denúncias com evidências para investigação patrimonial',
      'Informar ao gestor verbalmente'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -20, reputation: 15 },
    explanation: 'Desvio de patrimônio corporativo é falta grave que deve ser formalmente registrado com evidências. O canal de denúncias garante apuração adequada sem exposição do denunciante.'
  },
  {
    id: 'case-22',
    report: 'Funcionário descobre que a empresa coleta biometria dos funcionários sem consentimento formal e sem informar a finalidade.',
    options: [
      'Solicitar ao DPO adequação à LGPD com consentimento e informação de finalidade',
      'Parar de usar o ponto biométrico',
      'Não se preocupar pois biometria no ponto é comum',
      'Exigir que a empresa pare de coletar biometria'
    ],
    idealIndex: 0,
    impacts: { trust: 20, risk: -28, reputation: 18 },
    explanation: 'Dados biométricos são dados sensíveis sob a LGPD e requerem consentimento específico e informado. O DPO deve adequar o tratamento com base legal apropriada e transparência.'
  },
  {
    id: 'case-23',
    report: 'Colaborador relata que o gestor obriga a equipe a participar de eventos religiosos da empresa durante horário de trabalho.',
    options: [
      'Participar para não criar problemas',
      'Pedir dispensa individual ao RH',
      'Reportar ao RH e Compliance como possível violação de liberdade religiosa',
      'Sugerir eventos neutros alternativos'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -18, reputation: 18 },
    explanation: 'Obrigar participação em eventos religiosos viola liberdade de crença (art. 5° CF). RH e Compliance devem investigar e garantir que eventos corporativos respeitem a diversidade religiosa.'
  },
  {
    id: 'case-24',
    report: 'Funcionário percebe que relatórios financeiros apresentados a investidores contêm projeções infladas que não condizem com a realidade operacional.',
    options: [
      'Reportar diretamente ao Comitê de Auditoria ou Conselho como possível fraude contábil',
      'Alertar o diretor financeiro',
      'Aguardar a auditoria externa identificar',
      'Não se envolver em assuntos da diretoria'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -50, reputation: 35 },
    explanation: 'Projeções infladas a investidores podem configurar fraude de valores mobiliários. Deve ser reportado ao mais alto nível de governança independente, pois a gestão pode ser parte do problema.'
  },
  {
    id: 'case-25',
    report: 'Colaborador descobre que o setor comercial oferece descontos informais ("por fora") a clientes específicos sem registro no sistema.',
    options: [
      'Pedir que registrem os descontos no sistema',
      'Não reportar pois é estratégia comercial',
      'Informar ao gestor comercial',
      'Registrar no canal de denúncias como possível fraude ou desvio financeiro'
    ],
    idealIndex: 3,
    impacts: { trust: 20, risk: -25, reputation: 18 },
    explanation: 'Descontos informais sem registro podem encobrir desvios financeiros ou propinas. Deve ser registrado formalmente para investigação, pois os envolvidos podem incluir gestores.'
  },
  {
    id: 'case-26',
    report: 'Funcionário de compras recebe proposta de fornecedor oferecendo 5% de comissão pessoal sobre cada pedido aprovado.',
    options: [
      'Recusar e não reportar para não criar constrangimento',
      'Negociar desconto para a empresa em vez de comissão pessoal',
      'Recusar, documentar e reportar ao Compliance como tentativa de suborno',
      'Aceitar se beneficiar também a empresa'
    ],
    idealIndex: 2,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'Oferta de comissão pessoal é tentativa de suborno. Deve ser recusada, documentada e reportada ao Compliance. Apenas recusar sem registrar permite que o fornecedor tente novamente com outros.'
  },
  {
    id: 'case-27',
    report: 'Colaborador percebe que dados de geolocalização dos celulares corporativos estão sendo monitorados sem conhecimento dos funcionários.',
    options: [
      'Desativar a localização do celular',
      'Verificar se há política de monitoramento publicada',
      'Reportar ao DPO como possível violação de privacidade e LGPD',
      'Aceitar pois o celular é corporativo'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -28, reputation: 20 },
    explanation: 'Monitoramento de geolocalização sem ciência do funcionário viola LGPD e pode configurar invasão de privacidade. O DPO deve avaliar base legal, finalidade e implementar transparência.'
  },
  {
    id: 'case-28',
    report: 'Funcionário descobre que a empresa está descartando resíduos hospitalares no lixo comum para economizar com descarte especializado.',
    options: [
      'Registrar no canal de denúncias e reportar ao Compliance e órgão ambiental',
      'Orientar a equipe sobre separação correta',
      'Informar ao gestor de facilities',
      'Contratar empresa de descarte adequado'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -50, reputation: 30 },
    explanation: 'Descarte irregular de resíduos hospitalares é crime ambiental e sanitário grave. Deve ser reportado formalmente ao Compliance e ao órgão ambiental competente para cessação imediata e responsabilização.'
  },
  {
    id: 'case-29',
    report: 'Colaborador percebe que estagiários estão realizando atividades incompatíveis com o plano de estágio, equivalentes a funcionários efetivos.',
    options: [
      'Não reportar pois é bom para o aprendizado do estagiário',
      'Sugerir ao gestor que atualize o plano de estágio',
      'Reportar ao RH e Compliance como possível desvirtuamento da relação de estágio',
      'Orientar o estagiário sobre seus direitos'
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -22, reputation: 12 },
    explanation: 'Desvio de função de estagiário pode gerar vínculo empregatício e passivo trabalhista. RH e Compliance devem avaliar e corrigir para conformidade com a Lei do Estágio.'
  },
  {
    id: 'case-30',
    report: 'Funcionário descobre que a empresa emite certificados de treinamento de NR (Normas Regulamentadoras) para funcionários que não participaram dos treinamentos.',
    options: [
      'Realizar treinamentos corretivos',
      'Cancelar os certificados emitidos',
      'Reportar ao Compliance e SESMT como fraude documental com risco de segurança',
      'Investigar quem autorizou a prática'
    ],
    idealIndex: 2,
    impacts: { trust: 25, risk: -45, reputation: 22 },
    explanation: 'Emissão de certificados de NR sem treinamento real é fraude documental que coloca vidas em risco. Compliance e SESMT devem apurar responsabilidades e garantir treinamento efetivo.'
  },
  {
    id: 'case-31',
    report: 'Colaborador relata que o gestor pede para a equipe registrar horas extras que não foram trabalhadas para complementar renda.',
    options: [
      'Aceitar pois beneficia os funcionários',
      'Registrar no canal de denúncias como fraude trabalhista',
      'Recusar individualmente sem reportar',
      'Alertar o gestor sobre os riscos'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -30, reputation: 20 },
    explanation: 'Registro de horas extras fictícias é fraude trabalhista que prejudica a empresa financeiramente. Deve ser reportado formalmente, mesmo que pareça beneficiar os funcionários.'
  },
  {
    id: 'case-32',
    report: 'Funcionário de TI descobre uma vulnerabilidade grave no sistema que permite acesso a prontuários sem autenticação.',
    options: [
      'Corrigir silenciosamente sem informar ninguém',
      'Publicar a vulnerabilidade para pressionar correção rápida',
      'Documentar, corrigir e reportar formalmente ao DPO e gestão de segurança',
      'Aguardar o próximo pentest para documentar'
    ],
    idealIndex: 2,
    impacts: { trust: 28, risk: -50, reputation: 25 },
    explanation: 'Vulnerabilidade em prontuários é crítica. Deve ser documentada, corrigida e reportada formalmente para avaliação de impacto (possível incidente LGPD) e implementação de controles adicionais.'
  },
  {
    id: 'case-33',
    report: 'Colaborador percebe que a empresa solicita exame de gravidez em processos seletivos de mulheres.',
    options: [
      'Orientar candidatas a recusar o exame',
      'Reportar ao RH e Compliance como prática discriminatória ilegal',
      'Verificar se é prática do setor de saúde',
      'Sugerir que façam exame após contratação'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -35, reputation: 28 },
    explanation: 'Exigir exame de gravidez em processo seletivo é proibido por lei (art. 373-A CLT) e configura discriminação de gênero. Deve ser reportado formalmente para cessação imediata.'
  },
  {
    id: 'case-34',
    report: 'Funcionário descobre que a empresa mantém "lista negra" informal de ex-funcionários que moveram ações trabalhistas, impedindo recontratação.',
    options: [
      'Reportar ao Compliance e Jurídico como prática discriminatória',
      'Verificar se a lista é oficial',
      'Não reportar pois é direito da empresa',
      'Destruir a lista para eliminar evidências'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -28, reputation: 22 },
    explanation: 'Lista negra de ex-funcionários configura discriminação e viola o direito de ação judicial. Compliance e Jurídico devem cessar a prática e avaliar possíveis reparações.'
  },
  {
    id: 'case-35',
    report: 'Colaborador relata que amostras grátis de medicamentos são distribuídas à equipe para uso pessoal em vez de serem destinadas a pacientes.',
    options: [
      'Aceitar pois as amostras são gratuitas',
      'Devolver as amostras à farmácia',
      'Reportar ao Compliance como desvio de finalidade de amostras conforme regulamentação sanitária',
      'Orientar colegas sobre uso correto'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -25, reputation: 15 },
    explanation: 'Amostras grátis têm regulamentação específica da ANVISA e devem ser destinadas a pacientes. Desvio para uso pessoal viola normas sanitárias e deve ser reportado ao Compliance.'
  },
  {
    id: 'case-36',
    report: 'Funcionário percebe que a empresa não realiza due diligence em fornecedores antes de contratá-los, incluindo verificação de trabalho escravo na cadeia produtiva.',
    options: [
      'Solicitar ao departamento de compras que implemente processo de due diligence',
      'Reportar ao Compliance como falha nos controles anticorrupção e direitos humanos',
      'Verificar apenas fornecedores de maior valor',
      'Não é responsabilidade da empresa verificar fornecedores'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -35, reputation: 22 },
    explanation: 'Ausência de due diligence expõe a empresa a riscos de cumplicidade em trabalho escravo e violação da Lei Anticorrupção. Compliance deve implementar programa formal de verificação.'
  },
  {
    id: 'case-37',
    report: 'Colaborador descobre que o gestor está usando o cartão corporativo para despesas pessoais como combustível e restaurantes nos fins de semana.',
    options: [
      'Alertar o gestor sobre a irregularidade',
      'Verificar se há política de uso do cartão',
      'Registrar no canal de denúncias com datas e valores para auditoria',
      'Pedir ao financeiro que monitore os gastos'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -25, reputation: 18 },
    explanation: 'Uso de cartão corporativo para despesas pessoais é desvio patrimonial. Deve ser registrado formalmente com evidências para que auditoria investigue, pois alertar diretamente pode comprometer provas.'
  },
  {
    id: 'case-38',
    report: 'Funcionário percebe que a empresa não possui plano de resposta a incidentes de segurança de dados, apesar de tratar dados sensíveis de saúde.',
    options: [
      'Criar um plano informalmente',
      'Não reportar pois nunca houve incidente',
      'Reportar ao DPO e gestão como não conformidade crítica com a LGPD',
      'Aguardar exigência da ANPD'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -35, reputation: 15 },
    explanation: 'A LGPD exige plano de resposta a incidentes. A ausência é não conformidade crítica, especialmente para dados de saúde. DPO deve implementar imediatamente, sem esperar que um incidente ocorra.'
  },
  {
    id: 'case-39',
    report: 'Colaborador relata que um diretor utiliza informações privilegiadas sobre fusão da empresa para negociar ações no mercado.',
    options: [
      'Alertar o diretor sobre ilegalidade',
      'Reportar anonimamente à CVM e ao Comitê de Ética da empresa',
      'Verificar se as ações deram lucro',
      'Informar ao departamento jurídico'
    ],
    idealIndex: 1,
    impacts: { trust: 35, risk: -50, reputation: 35 },
    explanation: 'Uso de informação privilegiada (insider trading) é crime contra o mercado de capitais. Deve ser reportado à CVM e ao Comitê de Ética, pois o jurídico interno pode ter conflito de interesse.'
  },
  {
    id: 'case-40',
    report: 'Funcionário descobre que a empresa está operando com alvará de funcionamento vencido há mais de um ano.',
    options: [
      'Solicitar renovação ao departamento administrativo',
      'Não reportar pois a empresa está funcionando normalmente',
      'Registrar formalmente para que Compliance e Jurídico providenciem regularização urgente',
      'Informar aos bombeiros sobre a situação'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -35, reputation: 18 },
    explanation: 'Operar com alvará vencido é infração administrativa que pode resultar em interdição. Compliance e Jurídico devem ser acionados formalmente para regularização urgente e avaliação de riscos.'
  },
  {
    id: 'case-41',
    report: 'Colaborador percebe que fotografias de pacientes são tiradas e compartilhadas em grupo de WhatsApp da equipe médica para "discussão de casos".',
    options: [
      'Verificar se pacientes assinaram termo de consentimento',
      'Reportar ao DPO e Compliance como violação de privacidade e sigilo médico',
      'Orientar equipe a não incluir rostos',
      'Aceitar pois tem finalidade educativa'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -38, reputation: 28 },
    explanation: 'Compartilhamento de fotos de pacientes via WhatsApp viola sigilo médico, LGPD e resolução do CFM sobre telemedicina. Deve ser reportado ao DPO e Compliance independente de haver consentimento.'
  },
  {
    id: 'case-42',
    report: 'Funcionário relata que colegas utilizam sistemas corporativos com a senha de funcionários que saíram da empresa e não tiveram seus acessos revogados.',
    options: [
      'Revogar os acessos imediatamente',
      'Reportar à TI e Compliance como falha no processo de offboarding e risco de segurança',
      'Pedir aos colegas que parem de usar senhas alheias',
      'Verificar se há política de desligamento'
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -35, reputation: 18 },
    explanation: 'Acessos não revogados no desligamento são falha grave de segurança. Deve ser reportado formalmente à TI e Compliance para correção imediata e revisão do processo de offboarding.'
  },
  {
    id: 'case-43',
    report: 'Colaborador descobre que a empresa está realizando pagamentos a "empresas fantasma" que não possuem sede física ou funcionários.',
    options: [
      'Verificar se os serviços foram prestados',
      'Informar ao departamento financeiro',
      'Reportar ao Compliance e considerar comunicação ao Ministério Público como possível lavagem de dinheiro',
      'Solicitar comprovantes de entrega'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -50, reputation: 30 },
    explanation: 'Pagamentos a empresas fantasma são forte indício de lavagem de dinheiro ou caixa dois. Compliance deve investigar com urgência e, se confirmado, comunicar às autoridades competentes.'
  },
  {
    id: 'case-44',
    report: 'Funcionário percebe que o sistema de ar condicionado do centro cirúrgico não está sendo submetido à manutenção preventiva conforme cronograma obrigatório.',
    options: [
      'Solicitar manutenção ao setor de facilities',
      'Reportar ao Compliance e CCIH como risco sanitário que pode contaminar procedimentos',
      'Não operar no centro cirúrgico até manutenção',
      'Verificar se há filtro reserva'
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -45, reputation: 22 },
    explanation: 'Falha na manutenção do ar condicionado em centro cirúrgico é risco sanitário grave que pode causar infecções hospitalares. Deve ser reportado formalmente ao Compliance e CCIH para ação imediata.'
  },
  {
    id: 'case-45',
    report: 'Colaborador relata que um gestor promete promoção a subordinados em troca de apoio a candidato político nas eleições.',
    options: [
      'Reportar ao Compliance e considerar comunicação ao Ministério Público Eleitoral',
      'Orientar o gestor sobre neutralidade política',
      'Ignorar pois é período eleitoral',
      'Informar ao RH sobre a promessa de promoção'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -35, reputation: 25 },
    explanation: 'Assédio eleitoral no trabalho é crime e viola liberdade política dos funcionários. Deve ser reportado ao Compliance e, dependendo da gravidade, ao MPE para investigação.'
  },
  {
    id: 'case-46',
    report: 'Funcionário descobre que a empresa não cumpre a cota legal de aprendizes, contratando apenas para aparentar conformidade sem oferecer formação real.',
    options: [
      'Sugerir melhorias no programa de aprendizagem',
      'Não reportar pois há aprendizes contratados',
      'Reportar ao Compliance como descumprimento da Lei de Aprendizagem',
      'Informar ao Ministério do Trabalho'
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -22, reputation: 12 },
    explanation: 'Contratação de aprendizes sem formação real descumpre a Lei de Aprendizagem e pode gerar autuações. Compliance deve avaliar e garantir programa efetivo conforme legislação.'
  },
  {
    id: 'case-47',
    report: 'Colaborador percebe que reuniões de comitê de ética não são realizadas há mais de um ano, apesar de estarem previstas no código de conduta.',
    options: [
      'Solicitar ao presidente do comitê que retome reuniões',
      'Reportar ao Compliance como não conformidade com o programa de integridade',
      'Não reportar pois não há casos pendentes',
      'Organizar uma reunião informal'
    ],
    idealIndex: 1,
    impacts: { trust: 15, risk: -18, reputation: 12 },
    explanation: 'Inatividade do comitê de ética enfraquece o programa de integridade e pode ser vista como falta de comprometimento pela Alta Administração. Deve ser formalmente reportado ao Compliance.'
  },
  {
    id: 'case-48',
    report: 'Funcionário relata que a empresa cobra dos pacientes por procedimentos cobertos pelo SUS, realizando dupla cobrança.',
    options: [
      'Orientar pacientes sobre seus direitos',
      'Verificar se há erro no sistema de faturamento',
      'Reportar ao Compliance e considerar comunicação ao Ministério da Saúde como fraude ao SUS',
      'Informar ao setor de faturamento'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -48, reputation: 30 },
    explanation: 'Dupla cobrança por procedimentos do SUS é fraude ao sistema de saúde pública, com penalidades graves. Compliance deve apurar e, se confirmado, comunicar ao Ministério da Saúde.'
  },
  {
    id: 'case-49',
    report: 'Colaborador descobre que terceirizados não recebem os mesmos EPIs que funcionários efetivos, apesar de realizarem atividades idênticas.',
    options: [
      'Compartilhar EPIs com os terceirizados',
      'Verificar contrato de terceirização',
      'Reportar ao SESMT e Compliance como descumprimento de normas de segurança',
      'Informar à empresa terceirizada'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -38, reputation: 20 },
    explanation: 'A empresa contratante é corresponsável pela segurança de terceirizados. Não fornecer EPIs adequados viola NRs e pode gerar responsabilidade solidária. SESMT e Compliance devem corrigir.'
  },
  {
    id: 'case-50',
    report: 'Funcionário percebe que a empresa permite que menores de 18 anos trabalhem em horário noturno em setores administrativos.',
    options: [
      'Verificar se há autorização dos pais',
      'Reportar ao RH e Compliance como violação do ECA e CLT',
      'Não reportar pois é apenas setor administrativo',
      'Sugerir mudança de horário para os menores'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -35, reputation: 20 },
    explanation: 'Trabalho noturno de menores é proibido pelo ECA e CLT, independente do setor. RH e Compliance devem corrigir imediatamente para evitar autuações e proteger os menores.'
  },
  {
    id: 'case-51',
    report: 'Colaborador relata que o gestor solicita que funcionários assinem documentos em branco "para agilizar processos".',
    options: [
      'Assinar confiando no gestor',
      'Recusar e alertar colegas informalmente',
      'Registrar no canal de denúncias como prática irregular com risco de fraude',
      'Pedir ao gestor que explique o conteúdo antes'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -30, reputation: 20 },
    explanation: 'Solicitar assinatura em documento em branco é prática irregular que pode encobrir fraudes. Deve ser registrado formalmente para investigação, pois a pressão do gestor pode intimidar denúncias verbais.'
  },
  {
    id: 'case-52',
    report: 'Funcionário descobre que a empresa está usando base de dados de clientes para envio de marketing sem opt-in, incluindo dados obtidos de parceiros comerciais.',
    options: [
      'Incluir opção de descadastro nos e-mails',
      'Verificar se há contrato de compartilhamento de dados',
      'Reportar ao DPO como violação da LGPD por uso sem base legal e consentimento',
      'Parar o envio de marketing temporariamente'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -30, reputation: 22 },
    explanation: 'Marketing sem consentimento e com dados de terceiros viola múltiplos princípios da LGPD. O DPO deve avaliar base legal, cessar uso indevido e implementar processo adequado de consentimento.'
  },
  {
    id: 'case-53',
    report: 'Colaborador percebe que a empresa não possui canal de denúncias acessível a terceiros e fornecedores, apenas a funcionários internos.',
    options: [
      'Não reportar pois já existe canal para internos',
      'Sugerir expansão do canal ao RH',
      'Reportar ao Compliance como não conformidade com a Lei Anticorrupção e boas práticas',
      'Criar formulário online informal'
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -20, reputation: 12 },
    explanation: 'A Lei Anticorrupção e programas de integridade recomendam canal acessível a todos os stakeholders. A limitação é não conformidade que deve ser reportada ao Compliance para adequação.'
  },
  {
    id: 'case-54',
    report: 'Funcionário relata que a empresa utiliza câmeras ocultas nos banheiros alegando prevenção de furtos.',
    options: [
      'Verificar se há aviso sobre monitoramento',
      'Reportar ao Compliance, DPO e considerar comunicação à polícia como crime contra privacidade',
      'Desativar as câmeras imediatamente',
      'Informar aos funcionários sobre as câmeras'
    ],
    idealIndex: 1,
    impacts: { trust: 35, risk: -50, reputation: 35 },
    explanation: 'Câmeras em banheiros é crime contra a intimidade, independente da justificativa. Deve ser reportado ao Compliance, DPO e possivelmente à polícia, pois configura violação grave de direitos fundamentais.'
  },
  {
    id: 'case-55',
    report: 'Colaborador descobre que a empresa recebeu notificação da ANPD sobre incidente de dados mas não comunicou aos titulares afetados conforme determinado.',
    options: [
      'Verificar o prazo para comunicação',
      'Informar ao diretor jurídico',
      'Reportar ao DPO e Compliance como descumprimento de determinação da ANPD',
      'Aguardar nova notificação da ANPD'
    ],
    idealIndex: 2,
    impacts: { trust: 28, risk: -45, reputation: 30 },
    explanation: 'Descumprir determinação da ANPD pode resultar em sanções agravadas. DPO e Compliance devem providenciar comunicação imediata aos titulares e documentar as razões do atraso.'
  },
  {
    id: 'case-56',
    report: 'Funcionário percebe que a empresa está contratando trabalhadores estrangeiros em situação irregular, sem documentação adequada.',
    options: [
      'Reportar ao Compliance e RH como possível facilitação de imigração ilegal e exploração',
      'Orientar os trabalhadores a regularizarem documentos',
      'Não se envolver em questões migratórias',
      'Informar à Polícia Federal'
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 25 },
    explanation: 'Contratar trabalhadores sem documentação pode configurar exploração e facilitar imigração ilegal. Compliance e RH devem atuar para regularizar e proteger os direitos dos trabalhadores.'
  },
  {
    id: 'case-57',
    report: 'Colaborador relata que o gestor exige que ele forneça atestados médicos detalhados com CID para justificar ausências de um dia.',
    options: [
      'Fornecer o atestado com CID para evitar problemas',
      'Verificar se há política da empresa sobre atestados',
      'Reportar ao RH e Compliance como violação de privacidade médica',
      'Solicitar ao médico atestado sem CID'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -20, reputation: 15 },
    explanation: 'Exigir CID em atestados viola sigilo médico e privacidade do trabalhador. A empresa pode exigir atestado, mas não o diagnóstico. RH e Compliance devem corrigir a prática.'
  },
  {
    id: 'case-58',
    report: 'Funcionário descobre que a empresa realiza testes de drogas em funcionários sem previsão contratual ou política formal.',
    options: [
      'Aceitar pois é para segurança do trabalho',
      'Recusar o teste individualmente',
      'Reportar ao RH e Compliance como possível violação de direitos trabalhistas e privacidade',
      'Verificar se há base legal para o teste'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -25, reputation: 18 },
    explanation: 'Testes de drogas sem previsão contratual ou política formal podem violar direitos do trabalhador. RH e Compliance devem avaliar a legalidade e implementar política transparente se justificável.'
  },
  {
    id: 'case-59',
    report: 'Colaborador percebe que atas de reunião do conselho de administração contêm informações falsas sobre deliberações que não ocorreram.',
    options: [
      'Reportar ao Comitê de Auditoria como falsificação documental societária',
      'Alertar o secretário do conselho',
      'Verificar com outros conselheiros',
      'Solicitar retificação da ata'
    ],
    idealIndex: 0,
    impacts: { trust: 30, risk: -45, reputation: 30 },
    explanation: 'Falsificação de atas do conselho é fraude societária grave que pode afetar stakeholders. Deve ser reportado ao Comitê de Auditoria como órgão independente de governança.'
  },
  {
    id: 'case-60',
    report: 'Funcionário descobre que a empresa mantém dois sistemas de contabilidade: um oficial e outro paralelo com números diferentes.',
    options: [
      'Verificar qual sistema tem os números corretos',
      'Informar ao contador responsável',
      'Reportar ao Comitê de Auditoria e Compliance como possível fraude contábil',
      'Aguardar a auditoria externa descobrir'
    ],
    idealIndex: 2,
    impacts: { trust: 35, risk: -50, reputation: 35 },
    explanation: 'Contabilidade paralela é forte indício de fraude e evasão fiscal. Deve ser reportado ao mais alto nível de governança independente para investigação imediata.'
  },
  {
    id: 'case-61',
    report: 'Colaborador percebe que resultados de exames laboratoriais são enviados por e-mail sem criptografia, com dados de pacientes visíveis no corpo do e-mail.',
    options: [
      'Sugerir uso de sistema seguro de envio',
      'Reportar ao DPO e TI como vulnerabilidade de dados sensíveis de saúde',
      'Orientar pacientes a não usarem e-mail',
      'Pedir que coloquem resultados em PDF protegido'
    ],
    idealIndex: 1,
    impacts: { trust: 22, risk: -35, reputation: 22 },
    explanation: 'Envio de dados de saúde sem criptografia viola LGPD e boas práticas de segurança. DPO e TI devem implementar canal seguro para transmissão de resultados sensíveis.'
  },
  {
    id: 'case-62',
    report: 'Funcionário relata que a empresa obriga funcionários em aviso prévio a treinar seus substitutos sob ameaça de desconto no acerto.',
    options: [
      'Aceitar pois é prática de mercado',
      'Reportar ao RH e Compliance como possível coação trabalhista',
      'Verificar se há previsão contratual',
      'Orientar o funcionário a buscar advogado'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -22, reputation: 15 },
    explanation: 'Ameaçar descontos no acerto para forçar treinamento é coação e pode configurar assédio moral. RH e Compliance devem avaliar e garantir que o aviso prévio respeite direitos trabalhistas.'
  },
  {
    id: 'case-63',
    report: 'Colaborador descobre que a empresa não possui política de prevenção à lavagem de dinheiro, apesar de operar em setor regulado.',
    options: [
      'Criar uma política informal',
      'Não reportar pois nunca houve caso',
      'Reportar ao Compliance como não conformidade regulatória crítica',
      'Aguardar exigência do órgão regulador'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -38, reputation: 18 },
    explanation: 'Em setores regulados, a ausência de política PLD é não conformidade grave que pode resultar em sanções severas. Compliance deve implementar programa imediatamente.'
  },
  {
    id: 'case-64',
    report: 'Funcionário percebe que a empresa destruiu documentos que estavam sob ordem de preservação judicial (litigation hold).',
    options: [
      'Verificar se a destruição foi acidental',
      'Reportar ao Jurídico e Compliance como possível obstrução de justiça',
      'Tentar recuperar os documentos',
      'Não reportar para não piorar a situação'
    ],
    idealIndex: 1,
    impacts: { trust: 30, risk: -50, reputation: 30 },
    explanation: 'Destruição de documentos sob litigation hold pode configurar obstrução de justiça e resultar em sanções severas. Jurídico e Compliance devem ser informados imediatamente para mitigação de danos.'
  },
  {
    id: 'case-65',
    report: 'Colaborador relata que a empresa está armazenando dados de clientes em servidores localizados fora do país sem informar aos titulares.',
    options: [
      'Verificar se o país tem lei de proteção de dados adequada',
      'Migrar dados para servidor nacional',
      'Reportar ao DPO como possível transferência internacional irregular sob a LGPD',
      'Não reportar pois cloud computing é globalizado'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -30, reputation: 18 },
    explanation: 'Transferência internacional de dados sem informar titulares e sem mecanismo legal adequado viola a LGPD. O DPO deve avaliar e implementar medidas de conformidade para transferências internacionais.'
  },
  {
    id: 'case-66',
    report: 'Funcionário descobre que a equipe de vendas tem acesso irrestrito a todos os prontuários do hospital para "prospecção de clientes".',
    options: [
      'Restringir acesso do time de vendas',
      'Verificar se há base legal para o acesso',
      'Reportar ao DPO e Compliance como desvio de finalidade e acesso indevido a dados sensíveis',
      'Orientar vendas a não usar informações de saúde'
    ],
    idealIndex: 2,
    impacts: { trust: 28, risk: -45, reputation: 30 },
    explanation: 'Acesso a prontuários para prospecção comercial é desvio grave de finalidade e viola LGPD e sigilo médico. DPO e Compliance devem cessar imediatamente e investigar uso indevido.'
  },
  {
    id: 'case-67',
    report: 'Colaborador percebe que a empresa está pagando propina a fiscais municipais para evitar multas por irregularidades sanitárias.',
    options: [
      'Corrigir as irregularidades sanitárias primeiro',
      'Informar ao diretor operacional',
      'Registrar no canal de denúncias e considerar comunicação ao Ministério Público',
      'Aceitar como custo operacional do negócio'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -50, reputation: 30 },
    explanation: 'Pagamento de propina a fiscais é crime de corrupção ativa. Deve ser registrado no canal de denúncias e, pela gravidade, considerada comunicação ao Ministério Público.'
  },
  {
    id: 'case-68',
    report: 'Funcionário relata que a empresa obriga o uso de uniformes com logomarca de patrocinador sem previsão contratual ou compensação.',
    options: [
      'Usar o uniforme para evitar problemas',
      'Recusar individualmente',
      'Reportar ao RH e Compliance como possível violação de direito de imagem',
      'Negociar compensação coletivamente'
    ],
    idealIndex: 2,
    impacts: { trust: 12, risk: -15, reputation: 10 },
    explanation: 'Uso obrigatório de logomarca de patrocinador sem previsão contratual pode violar direito de imagem dos funcionários. RH e Compliance devem avaliar e adequar a prática.'
  },
  {
    id: 'case-69',
    report: 'Colaborador descobre que a empresa não mantém registro das atividades de tratamento de dados pessoais (ROPA) conforme exigido pela LGPD.',
    options: [
      'Criar um inventário de dados informalmente',
      'Reportar ao DPO como não conformidade com a LGPD que requer ação imediata',
      'Não reportar pois ainda não há fiscalização intensa',
      'Aguardar orientação da ANPD'
    ],
    idealIndex: 1,
    impacts: { trust: 18, risk: -28, reputation: 15 },
    explanation: 'O ROPA é obrigação legal da LGPD e demonstra accountability. Sua ausência é não conformidade que o DPO deve corrigir imediatamente, independente do nível de fiscalização.'
  },
  {
    id: 'case-70',
    report: 'Funcionário percebe que gestores estão monitorando e-mails pessoais dos funcionários acessados durante horário de trabalho.',
    options: [
      'Não acessar e-mail pessoal no trabalho',
      'Verificar se há política de monitoramento',
      'Reportar ao DPO e Compliance como possível violação de sigilo de comunicações',
      'Informar aos colegas sobre o monitoramento'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -28, reputation: 20 },
    explanation: 'Monitorar e-mails pessoais pode violar sigilo de correspondência, garantido constitucionalmente. DPO e Compliance devem avaliar a legalidade e proporcionalidade da prática.'
  },
  {
    id: 'case-71',
    report: 'Colaborador relata que a empresa está usando reconhecimento facial para controle de acesso sem informar funcionários sobre coleta e tratamento dos dados biométricos.',
    options: [
      'Aceitar pois melhora a segurança',
      'Solicitar informações ao departamento de segurança',
      'Reportar ao DPO como tratamento de dados sensíveis sem transparência e possível base legal inadequada',
      'Sugerir alternativas como cartão de acesso'
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -30, reputation: 20 },
    explanation: 'Reconhecimento facial coleta dados biométricos sensíveis. Sem informação clara e base legal adequada, viola a LGPD. O DPO deve avaliar necessidade, proporcionalidade e implementar transparência.'
  },
  {
    id: 'case-72',
    report: 'Funcionário descobre que a empresa está fazendo doações a partidos políticos usando conta de pessoa jurídica, prática proibida desde 2015.',
    options: [
      'Reportar ao Compliance e Jurídico como violação da legislação eleitoral',
      'Verificar se são doações ou patrocínios de eventos',
      'Informar ao departamento financeiro',
      'Não se envolver em questões políticas'
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -45, reputation: 28 },
    explanation: 'Doações de pessoa jurídica a partidos são proibidas desde 2015 (ADI 4650/STF). É violação grave da legislação eleitoral que deve ser reportada ao Compliance e Jurídico imediatamente.'
  },
  {
    id: 'case-73',
    report: 'Colaborador percebe que termos de consentimento para tratamento médico estão sendo assinados por familiares sem procuração quando o paciente está consciente e capaz.',
    options: [
      'Aceitar pois é prática comum',
      'Orientar equipe sobre consentimento informado',
      'Reportar ao Compliance e Jurídico como violação da autonomia do paciente',
      'Verificar se o paciente concordou verbalmente'
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -28, reputation: 18 },
    explanation: 'Consentimento informado deve ser do paciente quando capaz. Assinatura por terceiro sem procuração viola autonomia do paciente e pode invalidar o consentimento juridicamente.'
  },
  {
    id: 'case-74',
    report: 'Funcionário relata que a empresa está classificando incorretamente acidentes de trabalho como "mal súbito" para não emitir CAT.',
    options: [
      'Verificar classificação médica dos eventos',
      'Reportar ao SESMT e Compliance como fraude documental com implicações legais e previdenciárias',
      'Emitir CAT retroativamente',
      'Orientar funcionários sobre seus direitos'
    ],
    idealIndex: 1,
    impacts: { trust: 28, risk: -42, reputation: 25 },
    explanation: 'Classificar acidentes de trabalho como mal súbito para evitar CAT é fraude que priva trabalhadores de direitos previdenciários. SESMT e Compliance devem investigar e corrigir.'
  },
  {
    id: 'case-75',
    report: 'Colaborador descobre que a empresa mantém contratos com cláusulas abusivas que proíbem fornecedores de prestar serviços a concorrentes.',
    options: [
      'Não reportar pois é cláusula contratual aceita',
      'Sugerir revisão das cláusulas ao jurídico',
      'Reportar ao Compliance e Jurídico como possível prática anticoncorrencial',
      'Informar aos fornecedores sobre seus direitos'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -25, reputation: 15 },
    explanation: 'Cláusulas que restringem fornecedores podem configurar prática anticoncorrencial passível de sanção pelo CADE. Compliance e Jurídico devem avaliar e adequar os contratos.'
  },
  {
    id: 'case-76',
    report: 'Funcionário percebe que a empresa não possui programa de compliance efetivo, apenas um código de ética formal que ninguém conhece.',
    options: [
      'Divulgar o código de ética na empresa',
      'Não reportar pois existe código de ética',
      'Reportar à alta administração e Conselho como deficiência no programa de integridade',
      'Sugerir treinamentos sobre ética'
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -25, reputation: 15 },
    explanation: 'Um código de ética sem programa de compliance efetivo não atende às exigências da Lei Anticorrupção. A alta administração deve ser alertada para implementar programa completo.'
  },
  {
    id: 'case-77',
    report: 'Colaborador relata que dados de pesquisas clínicas estão sendo compartilhados com laboratório patrocinador sem anonimização dos pacientes.',
    options: [
      'Anonimizar os dados antes do próximo envio',
      'Verificar se há consentimento dos pacientes para compartilhamento',
      'Reportar ao DPO, Comitê de Ética em Pesquisa e Compliance como violação ética e legal',
      'Informar ao pesquisador principal'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -48, reputation: 30 },
    explanation: 'Compartilhamento de dados de pesquisa sem anonimização viola Resolução CNS 466/12, LGPD e ética em pesquisa. Deve ser reportado a múltiplas instâncias pela gravidade.'
  },
  {
    id: 'case-78',
    report: 'Funcionário descobre que a empresa não realiza verificação de antecedentes criminais para funcionários que lidam com menores de idade.',
    options: [
      'Solicitar que RH implemente verificação',
      'Não reportar pois nunca houve incidente',
      'Reportar ao Compliance como falha crítica de controle para proteção de menores',
      'Verificar legislação aplicável'
    ],
    idealIndex: 2,
    impacts: { trust: 25, risk: -40, reputation: 22 },
    explanation: 'A ausência de verificação de antecedentes para quem lida com menores é falha grave de proteção. Compliance deve implementar controle obrigatório conforme ECA e normas setoriais.'
  },
  {
    id: 'case-79',
    report: 'Colaborador percebe que a empresa está usando dados de saúde de funcionários coletados em exames admissionais para fins de seguro empresarial sem consentimento.',
    options: [
      'Reportar ao DPO como desvio de finalidade e violação da LGPD em dados sensíveis',
      'Verificar se há cláusula no contrato de trabalho',
      'Aceitar pois beneficia os funcionários com seguro',
      'Informar ao sindicato'
    ],
    idealIndex: 0,
    impacts: { trust: 22, risk: -32, reputation: 20 },
    explanation: 'Usar dados de saúde de exames admissionais para seguro é desvio de finalidade. Dados sensíveis de saúde têm proteção reforçada na LGPD e requerem consentimento específico para cada finalidade.'
  },
  {
    id: 'case-80',
    report: 'Funcionário relata que a empresa incentiva denúncias através do canal, mas na prática retalia denunciantes com transferências e exclusão de projetos.',
    options: [
      'Não usar o canal de denúncias',
      'Denunciar externamente ao Ministério Público',
      'Reportar ao Comitê de Ética ou Conselho como falha grave no programa de integridade',
      'Registrar evidências de retaliação'
    ],
    idealIndex: 2,
    impacts: { trust: 30, risk: -40, reputation: 30 },
    explanation: 'Retaliação contra denunciantes destrói a confiança no programa de compliance. Deve ser reportado ao nível mais alto de governança independente, pois a gestão pode estar envolvida na retaliação.'
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
