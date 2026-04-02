import { WhistleblowerCase } from '../types';
import { shuffleArray } from './expandedQuestions';

/**
 * 80 Casos para o jogo Canal de Denúncias
 * Questões de dificuldade média a difícil, exigindo conhecimento real de compliance.
 * Todas as opções são plausíveis — a correta exige raciocínio e conhecimento.
 * Os índices corretos variam entre todas as posições (0-3).
 */
export const expandedWhistleblowerCases: WhistleblowerCase[] = [
  {
    id: 'case-1',
    report: 'Durante uma auditoria, você identifica que um diretor autorizou pagamento antecipado a um fornecedor fora do fluxo de aprovação normal. O fornecedor entregou o serviço dentro do prazo e com qualidade.',
    options: [
      'Arquivar, pois o serviço foi prestado adequadamente',
      'Solicitar que o diretor regularize retroativamente a aprovação no sistema',
      'Avaliar se há padrão recorrente de desvio do fluxo antes de definir a ação',
      'Bloquear pagamentos futuros ao fornecedor até esclarecimento',
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -20, reputation: 12 },
    explanation: 'Um caso isolado pode ser erro processual, mas se houver padrão recorrente indica fraude. Antes de agir, é fundamental investigar o contexto para não tomar decisões desproporcionais nem negligenciar indícios.'
  },
  {
    id: 'case-2',
    report: 'Você recebe uma denúncia anônima sobre assédio moral, mas o relato é vago — sem datas, testemunhas ou detalhes específicos que permitam identificar vítima ou agressor.',
    options: [
      'Iniciar investigação completa imediatamente',
      'Arquivar por falta de elementos mínimos para apuração',
      'Convocar reunião geral sobre assédio no departamento mencionado',
      'Registrar formalmente e buscar mais informações antes de abrir investigação',
    ],
    idealIndex: 3,
    impacts: { trust: 16, risk: -21, reputation: 13 },
    explanation: 'Denúncias vagas não devem ser descartadas nem gerar investigação às cegas. O correto é registrar, preservar o sigilo e buscar elementos adicionais para decidir se há base para investigação formal.'
  },
  {
    id: 'case-3',
    report: "Um colaborador que participou de processo seletivo interno não foi selecionado e ameaça fazer uma denúncia 'inventada' contra o gestor que o reprovou, como retaliação.",
    options: [
      'Ignorar, pois denúncias anônimas serão investigadas de qualquer forma',
      'Orientar que denúncias falsas configuram infração disciplinar e podem ter consequências',
      'Abrir investigação preventiva contra o gestor',
      'Comunicar ao gestor que ele poderá ser alvo de denúncia',
    ],
    idealIndex: 1,
    impacts: { trust: 17, risk: -22, reputation: 14 },
    explanation: 'Denúncias falsas deliberadas são infrações graves. O colaborador deve ser orientado sobre as consequências de má-fé, sem intimidá-lo, mas garantindo que entenda a seriedade do canal.'
  },
  {
    id: 'case-4',
    report: 'Ao investigar uma denúncia de fraude em licitação, você descobre que o denunciante é também um dos envolvidos no esquema, mas fez a denúncia para prejudicar um rival interno.',
    options: [
      'Desconsiderar a denúncia por má-fé do denunciante',
      'Punir o denunciante por participação no esquema e encerrar',
      'Apurar os fatos relatados independentemente da motivação do denunciante',
      'Investigar apenas o denunciante por sua participação',
    ],
    idealIndex: 2,
    impacts: { trust: 18, risk: -23, reputation: 15 },
    explanation: 'A motivação do denunciante é irrelevante para a apuração dos fatos. Mesmo denúncias feitas por má-fé podem revelar irregularidades reais que devem ser investigadas no mérito.'
  },
  {
    id: 'case-5',
    report: 'Durante o processo de investigação de uma denúncia, o investigador percebe que a testemunha-chave é cônjuge do denunciado. O depoimento dela inocenta completamente o acusado.',
    options: [
      'Aceitar o depoimento como evidência válida',
      'Considerar o depoimento com ressalvas, buscando corroboração em outras fontes',
      'Descartar o depoimento por conflito de interesse evidente',
      'Convocar nova testemunha para substituir',
    ],
    idealIndex: 1,
    impacts: { trust: 19, risk: -24, reputation: 16 },
    explanation: 'Depoimentos de pessoas com vínculo próximo não devem ser automaticamente descartados nem aceitos sem ressalvas. Devem ser considerados com cautela e corroborados por evidências independentes.'
  },
  {
    id: 'case-6',
    report: "Um gestor pede acesso aos registros do canal de denúncias para 'melhorar o ambiente do seu departamento'. Ele não é membro do Comitê de Ética.",
    options: [
      'Negar qualquer acesso, pois a confidencialidade é absoluta no canal',
      'Conceder acesso restrito aos casos do departamento dele',
      'Fornecer apenas estatísticas agregadas sem identificação de denúncias',
      'Encaminhar a solicitação ao Comitê de Ética para deliberação',
    ],
    idealIndex: 2,
    impacts: { trust: 20, risk: -25, reputation: 17 },
    explanation: 'O gestor tem interesse legítimo em melhorar o ambiente, mas não pode acessar denúncias individuais. Estatísticas agregadas e sem identificação atendem a necessidade sem violar a confidencialidade.'
  },
  {
    id: 'case-7',
    report: 'Ao finalizar uma investigação, você conclui que houve assédio moral, mas o agressor é um diretor com excelentes resultados financeiros e forte apoio do CEO.',
    options: [
      'Aplicar a medida disciplinar prevista, independente do cargo ou resultados',
      'Registrar a conclusão e recomendar coaching ao diretor como alternativa',
      'Apresentar os resultados ao CEO para que ele decida a melhor abordagem',
      'Sugerir transferência da vítima para resolver o conflito',
    ],
    idealIndex: 0,
    impacts: { trust: 21, risk: -26, reputation: 18 },
    explanation: 'O resultado da investigação deve gerar consequências proporcionais, independente do cargo, desempenho ou influência do agressor. Tratar de forma diferente por hierarquia compromete todo o programa de integridade.'
  },
  {
    id: 'case-8',
    report: 'Um colaborador faz uma denúncia identificada contra seu próprio gestor por favorecimento em promoções. Durante a investigação, o gestor descobre quem é o denunciante.',
    options: [
      'Transferir o denunciante para outro departamento preventivamente',
      'Encerrar a investigação por comprometimento do sigilo',
      'Investigar como o gestor descobriu e aplicar medidas de proteção ao denunciante',
      'Acelerar a conclusão da investigação antes que haja retaliação',
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -27, reputation: 19 },
    explanation: 'A quebra de sigilo é uma violação grave que deve ser investigada em paralelo. A prioridade é proteger o denunciante contra retaliação, não encerrar o processo nem punir antecipadamente.'
  },
  {
    id: 'case-9',
    report: 'Uma funcionária relata que foi demitida 15 dias após ter feito uma denúncia no canal. A empresa alega baixo desempenho como motivo da demissão.',
    options: [
      'Aceitar a justificativa da empresa, pois desempenho é motivo válido',
      'Anular a demissão automaticamente por ser retaliação presumida',
      'Analisar cronologia, evidências de desempenho anteriores à denúncia e processo decisório',
      'Readmitir a funcionária e demitir quem autorizou a dispensa',
    ],
    idealIndex: 2,
    impacts: { trust: 23, risk: -28, reputation: 20 },
    explanation: 'Nem toda demissão após denúncia é retaliação, mas a proximidade temporal gera presunção que deve ser investigada. É necessário analisar se havia documentação prévia de desempenho e quem decidiu a demissão.'
  },
  {
    id: 'case-10',
    report: 'Uma investigação de compliance revela que 3 funcionários participaram de um esquema de notas fiscais frias. Um deles colaborou voluntariamente com a investigação e forneceu provas decisivas.',
    options: [
      'Aplicar a mesma punição aos três, pois todos participaram',
      'Considerar atenuante para quem colaborou, mas manter responsabilização proporcional',
      'Isentar completamente o colaborador que ajudou',
      'Demitir os três por justa causa imediatamente',
    ],
    idealIndex: 1,
    impacts: { trust: 24, risk: -29, reputation: 21 },
    explanation: 'Programas de leniência premiam a colaboração com atenuantes, não com isenção total. O colaborador deve ser responsabilizado proporcionalmente, mas sua contribuição para a apuração deve ser considerada.'
  },
  {
    id: 'case-11',
    report: 'Um gerente comercial oferece desconto de 40% a um cliente em troca de um contrato de exclusividade de 5 anos, sem aprovação da diretoria comercial.',
    options: [
      'Analisar se o desconto está dentro da alçada do gerente e se há política para exclusividade',
      'É prática comercial legítima se o contrato compensar financeiramente',
      'Cancelar o contrato imediatamente por irregularidade',
      'Aprovar retroativamente se o contrato for lucrativo',
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -30, reputation: 22 },
    explanation: 'Antes de julgar a ação, é preciso verificar se há política de alçadas para descontos e exclusividade. Pode ser apenas descumprimento de processo ou pode indicar favorecimento — depende do contexto normativo.'
  },
  {
    id: 'case-12',
    report: 'O Compliance recebe uma denúncia indicando que o próprio Diretor de Compliance está envolvido em conflito de interesse com um fornecedor de consultoria.',
    options: [
      'O Compliance investiga normalmente pois tem autonomia',
      'Comunicar ao CEO para que ele investigue',
      'Contratar auditoria externa imediatamente',
      'Encaminhar ao Conselho de Administração ou Comitê de Auditoria para apuração independente',
    ],
    idealIndex: 3,
    impacts: { trust: 26, risk: -31, reputation: 23 },
    explanation: 'Quando o próprio Compliance é alvo, a apuração deve ser conduzida por instância superior e independente — o Conselho ou Comitê de Auditoria. O CEO pode estar conflitado se tiver proximidade com o diretor.'
  },
  {
    id: 'case-13',
    report: 'Um fornecedor vence uma licitação com preço 30% abaixo do mercado. Não há indícios de fraude, mas a equipe técnica questiona a viabilidade de entrega nessas condições.',
    options: [
      'Aceitar pois o processo licitatório foi regular',
      'Cancelar a licitação e abrir novo processo',
      'Solicitar demonstração de capacidade técnica e financeira antes de contratar',
      'Desclassificar por preço inexequível',
    ],
    idealIndex: 2,
    impacts: { trust: 27, risk: -32, reputation: 24 },
    explanation: 'Preço abaixo do mercado não é automaticamente fraude, mas pode indicar inexequibilidade. O correto é exigir comprovação de que o fornecedor tem condições de entregar, preservando o processo licitatório.'
  },
  {
    id: 'case-14',
    report: 'Um funcionário do financeiro relata que há duas versões do balanço patrimonial: uma para o banco e outra para a Receita Federal.',
    options: [
      'Comunicar imediatamente à Receita Federal',
      'Preservar ambos os documentos como evidência e reportar ao Comitê de Auditoria',
      'Confrontar o diretor financeiro com as evidências',
      'Verificar se as diferenças são explicáveis por critérios contábeis diferentes',
    ],
    idealIndex: 1,
    impacts: { trust: 28, risk: -33, reputation: 25 },
    explanation: 'Duas versões de balanço podem indicar fraude contábil grave. As evidências devem ser preservadas antes de qualquer confrontação, e o reporte deve ir ao Comitê de Auditoria, não diretamente ao regulador sem apuração.'
  },
  {
    id: 'case-15',
    report: 'Uma colaboradora reporta que foi pressionada por seu gestor a omitir uma não-conformidade no relatório de qualidade de um produto que será exportado.',
    options: [
      'Orientar a colaboradora a incluir a não-conformidade no relatório',
      'Verificar a materialidade da não-conformidade antes de agir',
      'Garantir que o relatório reflita a realidade e investigar a conduta do gestor',
      'Substituir a colaboradora por outro profissional para refazer o relatório',
    ],
    idealIndex: 2,
    impacts: { trust: 29, risk: -34, reputation: 26 },
    explanation: 'A omissão de não-conformidade em exportação pode ter consequências regulatórias internacionais. É necessário corrigir o relatório E investigar por que o gestor pressionou — pode indicar padrão de encobrimento.'
  },
  {
    id: 'case-16',
    report: 'Durante due diligence de uma aquisição, você descobre que a empresa-alvo possui passivo trabalhista oculto significativo não declarado nas demonstrações financeiras.',
    options: [
      'Informar ao conselho para renegociação do preço de aquisição',
      'Cancelar a aquisição imediatamente',
      'Reportar apenas ao departamento jurídico para avaliação',
      'Documentar a descoberta e avaliar impacto na tese de investimento junto ao conselho e assessores jurídicos',
    ],
    idealIndex: 3,
    impacts: { trust: 30, risk: -35, reputation: 27 },
    explanation: 'Passivo oculto é fato relevante que pode mudar completamente a tese de aquisição. A decisão não é automática (cancelar ou renegociar) — exige análise multidisciplinar com documentação adequada.'
  },
  {
    id: 'case-17',
    report: 'Você descobre que um trainee está coletando dados pessoais de colegas (fotos, endereços, redes sociais) e armazenando em planilha pessoal. Ele alega que é para um projeto de integração da equipe.',
    options: [
      'Advertir verbalmente e pedir que apague os dados',
      'Verificar se há base legal para o tratamento e se o gestor autorizou a coleta',
      'Demitir por violação de LGPD',
      'Autorizar desde que os dados sejam mantidos em servidor corporativo',
    ],
    idealIndex: 1,
    impacts: { trust: 31, risk: -36, reputation: 28 },
    explanation: 'Mesmo com boa intenção, coleta de dados pessoais exige base legal e autorização. Antes de punir, deve-se verificar se o gestor sabia, se havia consentimento e qual a extensão dos dados coletados.'
  },
  {
    id: 'case-18',
    report: 'Um executivo pede para usar o jato corporativo para levar a família em viagem de férias, se comprometendo a reembolsar o custo do combustível.',
    options: [
      'Autorizar pois haverá reembolso',
      'Negar, pois ativos corporativos não podem ser usados para fins pessoais independente de reembolso',
      'Consultar a política de uso de ativos corporativos antes de decidir',
      'Autorizar se o CEO aprovar por escrito',
    ],
    idealIndex: 2,
    impacts: { trust: 32, risk: -37, reputation: 29 },
    explanation: 'A resposta depende da política da empresa. Algumas permitem uso pessoal com reembolso integral, outras proíbem categoricamente. Não se deve presumir — a política interna deve ser o guia.'
  },
  {
    id: 'case-19',
    report: 'Um membro do Comitê de Ética revela em conversa informal com amigos (não funcionários) detalhes de uma investigação em andamento, sem citar nomes.',
    options: [
      'Não é violação pois não citou nomes',
      'Substituí-lo do Comitê de Ética por quebra de confidencialidade',
      'Anular a investigação por comprometimento',
      'Advertir formalmente sobre o dever de sigilo e avaliar se houve prejuízo à investigação',
    ],
    idealIndex: 3,
    impacts: { trust: 33, risk: -38, reputation: 30 },
    explanation: 'Mesmo sem citar nomes, compartilhar detalhes de investigação é quebra de confidencialidade. A resposta deve ser proporcional: advertência formal com avaliação de impacto real, não automaticamente a remoção.'
  },
  {
    id: 'case-20',
    report: 'Um funcionário relata que o RH está usando algoritmo de IA para triagem de currículos, mas o algoritmo parece rejeitar sistematicamente candidatos acima de 50 anos.',
    options: [
      'Solicitar auditoria de viés algorítmico e análise estatística dos resultados de triagem',
      'Suspender o uso do algoritmo imediatamente',
      'Informar aos candidatos rejeitados sobre o possível viés',
      'Substituir o algoritmo por triagem manual',
    ],
    idealIndex: 0,
    impacts: { trust: 34, risk: -39, reputation: 31 },
    explanation: 'Viés algorítmico é questão complexa que exige evidência estatística. Antes de suspender ou substituir, é preciso auditar para confirmar se o viés existe e em que grau, para então decidir a ação corretiva adequada.'
  },
  {
    id: 'case-21',
    report: 'Empresa multinacional. O escritório do Brasil segue prática local de dar presentes em datas comemorativas a funcionários públicos. O valor individual é baixo (R$ 50), mas são 200 funcionários públicos beneficiados.',
    options: [
      'Permitir pois o valor individual é insignificante',
      'Substituir presentes por doações a instituições de caridade',
      'Proibir qualquer presente a funcionário público',
      'Avaliar o valor agregado total e verificar conformidade com FCPA, UK Bribery Act e legislação anticorrupção local',
    ],
    idealIndex: 3,
    impacts: { trust: 15, risk: -40, reputation: 32 },
    explanation: 'Em multinacionais, o valor individual pode parecer baixo, mas o valor agregado (R$ 10.000) e a frequência podem configurar padrão de pagamentos facilitadores sob FCPA e UK Bribery Act.'
  },
  {
    id: 'case-22',
    report: 'Colaborador descobre que a empresa subcontrata serviço de limpeza de uma empresa que emprega imigrantes em situação irregular, com jornadas de 14h diárias.',
    options: [
      'Rescindir contrato imediatamente com a empresa de limpeza',
      'Não é responsabilidade da empresa contratante',
      'Avaliar a responsabilidade solidária da empresa e notificar as autoridades trabalhistas',
      'Exigir regularização documental dos trabalhadores pelo subcontratado',
    ],
    idealIndex: 2,
    impacts: { trust: 16, risk: -41, reputation: 33 },
    explanation: 'A empresa contratante pode ser responsável solidariamente por condições análogas a trabalho escravo na cadeia produtiva. A avaliação jurídica e notificação às autoridades são prioritárias.'
  },
  {
    id: 'case-23',
    report: 'O setor de marketing quer publicar cases de sucesso usando dados reais de clientes que deram consentimento verbal durante reuniões, sem documento formal.',
    options: [
      'Obter consentimento formal por escrito especificando a finalidade antes da publicação',
      'Publicar pois houve consentimento verbal',
      'Publicar anonimizando os dados dos clientes',
      'Solicitar aprovação apenas do departamento jurídico',
    ],
    idealIndex: 0,
    impacts: { trust: 17, risk: -42, reputation: 12 },
    explanation: 'Consentimento verbal não é verificável e pode ser insuficiente sob LGPD. O consentimento deve ser formal, específico e documentado, indicando exatamente como os dados serão utilizados.'
  },
  {
    id: 'case-24',
    report: 'Uma investigação interna revela que o CFO movimentou R$ 2 milhões da conta da empresa para uma offshore de sua propriedade. Ele alega que foi empréstimo temporário e já devolveu.',
    options: [
      'Aceitar a explicação pois o valor foi devolvido',
      'Exigir apenas formalização retroativa do empréstimo',
      'Aplicar advertência formal e monitorar movimentações futuras',
      'Tratar como desvio financeiro independente da devolução e reportar ao Conselho e autoridades',
    ],
    idealIndex: 3,
    impacts: { trust: 18, risk: -43, reputation: 13 },
    explanation: 'Movimentação não autorizada de recursos da empresa para conta pessoal/offshore é desvio financeiro, independente de devolução. A devolução pode ser tentativa de acobertar após descoberta.'
  },
  {
    id: 'case-25',
    report: "Você identifica que a área comercial mantém um 'caixa dois' informal para pagar comissões extras a vendedores de alta performance, fora da folha de pagamento.",
    options: [
      'Encerrar a prática e apurar responsabilidades, incluindo análise fiscal e trabalhista',
      'Regularizar as comissões incluindo-as na folha de pagamento',
      'Tolerar temporariamente até o fim do trimestre para não impactar vendas',
      'Consultar o departamento fiscal sobre como regularizar',
    ],
    idealIndex: 0,
    impacts: { trust: 19, risk: -44, reputation: 14 },
    explanation: 'Caixa dois configura sonegação fiscal e fraude trabalhista. Não basta regularizar — é necessário apurar quem autorizou, quantificar o impacto fiscal e avaliar necessidade de denúncia espontânea.'
  },
  {
    id: 'case-26',
    report: 'Um colaborador é flagrado tirando fotos de documentos confidenciais na mesa de um colega com o celular pessoal.',
    options: [
      'Exigir que apague as fotos imediatamente',
      'Registrar o incidente, ouvir o colaborador e avaliar a natureza dos documentos fotografados',
      'Apreender o celular como evidência',
      'Demitir por justa causa por violação de confidencialidade',
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -45, reputation: 15 },
    explanation: 'Antes de agir, é preciso entender o contexto: quais documentos foram fotografados, com qual finalidade e se houve dolo. A empresa não pode apreender celular pessoal, e a demissão sem apuração pode ser revertida.'
  },
  {
    id: 'case-27',
    report: 'A diretoria decide reduzir o orçamento do programa de compliance em 60% alegando necessidade de corte de custos. Você é o Compliance Officer.',
    options: [
      'Aceitar o corte e priorizar atividades essenciais',
      'Recusar o corte e escalar ao Conselho de Administração',
      'Apresentar análise de risco-retorno mostrando o custo potencial de não-conformidade versus o investimento em compliance',
      'Pedir demissão por impossibilidade de exercer a função',
    ],
    idealIndex: 2,
    impacts: { trust: 21, risk: -46, reputation: 16 },
    explanation: 'O Compliance Officer deve demonstrar objetivamente o valor do programa. Uma análise de risco-retorno com dados de multas, processos e reputação é mais eficaz que simplesmente recusar ou aceitar.'
  },
  {
    id: 'case-28',
    report: 'Funcionário descobre que o sistema de controle de acesso do prédio registra a biometria facial dos visitantes sem informá-los e sem política de retenção definida.',
    options: [
      'Desativar o sistema de reconhecimento facial imediatamente',
      'Comunicar diretamente à ANPD como incidente de segurança',
      'Implementar aviso aos visitantes e criar política de retenção antes de qualquer ação drástica',
      'Substituir por crachás de visitante sem biometria',
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -47, reputation: 17 },
    explanation: 'Dados biométricos são sensíveis sob LGPD e exigem consentimento específico. Porém, desativar abruptamente pode comprometer segurança. O correto é implementar transparência e controles, criando política adequada.'
  },
  {
    id: 'case-29',
    report: 'Empresa farmacêutica. Um pesquisador altera dados de teste clínico para que um medicamento atinja o limiar de eficácia exigido pela ANVISA.',
    options: [
      'Refazer os testes com supervisão adicional',
      'Interromper o estudo clínico e notificar ANVISA, CEP e patrocinador simultaneamente',
      'Confrontar o pesquisador e solicitar correção dos dados',
      'Aguardar revisão por pares para confirmar a alteração',
    ],
    idealIndex: 1,
    impacts: { trust: 23, risk: -48, reputation: 18 },
    explanation: 'Fraude em dados clínicos é gravíssima — pode colocar vidas em risco. O estudo deve ser interrompido imediatamente e todas as autoridades competentes notificadas sem esperar confirmação adicional.'
  },
  {
    id: 'case-30',
    report: "Em uma fusão, você descobre que a empresa adquirida pagava 'taxas de facilitação' a fiscais portuários para agilizar liberação de mercadorias. A prática era documentada como 'serviços de despachante'.",
    options: [
      'Encerrar a prática e incluir cláusula anticorrupção no contrato de aquisição',
      'Manter temporariamente para não prejudicar operações',
      'Renegociar o preço de aquisição para cobrir multas potenciais',
      'Avaliar exposição legal cumulativa, cessar imediatamente e considerar auto-denúncia às autoridades',
    ],
    idealIndex: 3,
    impacts: { trust: 24, risk: -49, reputation: 19 },
    explanation: 'Pagamentos de facilitação são proibidos pela Lei Anticorrupção e FCPA. Como eram sistemáticos e documentados, há exposição legal significativa que pode exigir auto-denúncia para mitigação de penalidades.'
  },
  {
    id: 'case-31',
    report: 'Funcionário relata que colegas de trabalho criaram grupo de WhatsApp onde compartilham piadas ofensivas sobre orientação sexual de outro colega.',
    options: [
      'Advertir os participantes do grupo',
      'Apurar a situação, ouvindo envolvidos e vítima, e avaliar se configura assédio moral coletivo',
      'Encaminhar ao jurídico para avaliação de dano moral',
      'Solicitar que apaguem o grupo',
    ],
    idealIndex: 1,
    impacts: { trust: 25, risk: -20, reputation: 20 },
    explanation: 'Piadas discriminatórias podem configurar assédio moral coletivo e discriminação. A apuração deve ser completa — ouvindo todos os lados — para definir a gravidade e medida disciplinar adequada.'
  },
  {
    id: 'case-32',
    report: 'O board solicita que o Compliance assine um parecer favorável a uma operação que você não teve tempo de analisar adequadamente. A decisão é urgente.',
    options: [
      'Recusar assinar e solicitar prazo mínimo para análise',
      'Assinar com ressalvas documentadas sobre a análise incompleta',
      'Assinar pois o board assumirá a responsabilidade',
      'Delegar a assinatura a um subordinado',
    ],
    idealIndex: 0,
    impacts: { trust: 26, risk: -21, reputation: 21 },
    explanation: 'O Compliance Officer não pode validar o que não analisou. A pressão por urgência não justifica comprometer a integridade do parecer. Deve-se recusar e documentar a solicitação para proteção própria.'
  },
  {
    id: 'case-33',
    report: 'Você descobre que a empresa terceiriza call center em cidade do interior onde os operadores recebem por produtividade, sem salário fixo, sem registro CLT e sem benefícios.',
    options: [
      'Rescindir contrato com a empresa de call center',
      'Não é responsabilidade da contratante como os terceirizados são remunerados',
      'Exigir que a empresa terceirizada regularize os vínculos em 30 dias',
      'Mapear a extensão do problema, avaliar responsabilidade solidária e notificar autoridades',
    ],
    idealIndex: 3,
    impacts: { trust: 27, risk: -22, reputation: 22 },
    explanation: 'Ausência de salário fixo e CLT pode configurar trabalho irregular e até análogo ao escravo. A contratante tem responsabilidade solidária na cadeia. Precisa mapear o problema para dimensionar o risco legal.'
  },
  {
    id: 'case-34',
    report: 'Um funcionário é eleito vereador e pretende conciliar o mandato político com seu cargo na empresa. Ele é gerente do setor de relações governamentais.',
    options: [
      'Avaliar conflito de interesse pela natureza do cargo e considerar licença ou mudança de função',
      'Permitir pois é direito constitucional exercer mandato político',
      'Exigir que se licencie do cargo durante todo o mandato',
      'Demitir pois funcionário público não pode manter vínculo CLT',
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -23, reputation: 23 },
    explanation: 'O direito ao mandato é constitucional, mas o cargo de relações governamentais gera conflito de interesse direto. A análise deve ser caso a caso, considerando mudança de função ou licença parcial.'
  },
  {
    id: 'case-35',
    report: 'Investigação revela que um gerente contratou sua ex-esposa como consultora. Ela tem qualificação técnica comprovada e foi a melhor proposta técnica e financeira.',
    options: [
      'Manter o contrato, mas transferir a gestão para outro gerente sem vínculo pessoal',
      'Encerrar o contrato por conflito de interesse',
      'Ignorar pois são ex-cônjuges e a contratação foi técnica',
      'Refazer a licitação excluindo a consultora',
    ],
    idealIndex: 0,
    impacts: { trust: 29, risk: -24, reputation: 24 },
    explanation: 'Mesmo com qualificação técnica, o vínculo pessoal gera conflito de interesse na gestão do contrato. A solução equilibrada é manter o contrato (foi a melhor proposta) mas transferir a supervisão.'
  },
  {
    id: 'case-36',
    report: 'Um whistleblower externo (ex-funcionário) entrega documentos que provam fraude, mas admite que obteve os documentos acessando ilegalmente o sistema da empresa após sua demissão.',
    options: [
      'Rejeitar as evidências por serem obtidas ilegalmente',
      'Avaliar as evidências no mérito, investigar a fraude e também apurar o acesso não autorizado',
      'Denunciar o ex-funcionário por invasão de sistema',
      'Usar as evidências para investigar mas sem revelar a fonte',
    ],
    idealIndex: 1,
    impacts: { trust: 30, risk: -25, reputation: 25 },
    explanation: 'Evidências obtidas ilegalmente não devem ser automaticamente descartadas na esfera administrativa interna. Os fatos devem ser apurados, e o acesso ilegal deve ser tratado separadamente.'
  },
  {
    id: 'case-37',
    report: 'Uma multinacional descobre que sua fábrica no Sudeste Asiático utiliza trabalho infantil na cadeia de suprimentos de terceiro nível (subfornecedor do subfornecedor).',
    options: [
      'Não é responsabilidade pois está muito distante na cadeia',
      'Implementar due diligence aprofundada na cadeia, plano de remediação e monitoramento contínuo',
      'Cortar relações com toda a cadeia de suprimentos da região',
      'Comunicar às autoridades locais e aguardar providências',
    ],
    idealIndex: 1,
    impacts: { trust: 31, risk: -26, reputation: 26 },
    explanation: 'Sob os Princípios Orientadores da ONU e legislações como a alemã de cadeias de suprimentos, empresas têm dever de diligência em toda a cadeia. A resposta deve ser remediação progressiva, não corte abrupto.'
  },
  {
    id: 'case-38',
    report: 'Auditor interno descobre que a empresa está classificando incorretamente receitas entre trimestres para atingir metas de performance e liberar bônus à diretoria.',
    options: [
      'Corrigir os registros contábeis e recalcular os bônus',
      'Informar ao diretor financeiro para que corrija',
      'Reportar ao Comitê de Auditoria como potencial manipulação de resultados e avaliar implicações regulatórias',
      'Consultar a empresa de auditoria externa sobre o tratamento contábil',
    ],
    idealIndex: 2,
    impacts: { trust: 32, risk: -27, reputation: 27 },
    explanation: 'Reclassificação intencional de receitas para atingir metas é manipulação contábil. O reporte deve ir ao Comitê de Auditoria, não ao CFO que pode estar envolvido, e as implicações regulatórias devem ser avaliadas.'
  },
  {
    id: 'case-39',
    report: 'Uma funcionária do RH descobre que seu próprio salário está significativamente abaixo do piso praticado para sua função, mas não tem certeza se é discriminação de gênero ou apenas defasagem.',
    options: [
      'Pedir aumento ao gestor direto',
      'Solicitar análise de equidade salarial por função e gênero ao Compliance antes de concluir qualquer coisa',
      'Registrar queixa formal de discriminação',
      'Consultar advogado trabalhista externo',
    ],
    idealIndex: 1,
    impacts: { trust: 33, risk: -28, reputation: 28 },
    explanation: 'Antes de concluir que é discriminação, é necessário análise estatística de equidade salarial. Pode ser defasagem geral. A análise objetiva evita acusações infundadas ou negligência de discriminação real.'
  },
  {
    id: 'case-40',
    report: 'Empresa está implementando programa de ESG e o marketing quer divulgar metas ambientais ambiciosas que a operação admite internamente que são inatingíveis no prazo proposto.',
    options: [
      'Alinhar metas públicas com capacidade real de entrega, documentando riscos de greenwashing',
      'Publicar metas aspiracionais pois motivam a empresa',
      'Não publicar nenhuma meta ambiental',
      'Publicar as metas mas com disclaimers legais',
    ],
    idealIndex: 0,
    impacts: { trust: 34, risk: -29, reputation: 29 },
    explanation: 'Divulgar metas sabidamente inatingíveis configura greenwashing, prática cada vez mais penalizada por reguladores e investidores. Metas devem ser ambiciosas mas factíveis, com transparência sobre metodologia.'
  },
  {
    id: 'case-41',
    report: "Um concorrente entra em contato propondo que as duas empresas 'alinhem' reajustes de preços no próximo trimestre para 'estabilizar o mercado'.",
    options: [
      'Recusar, documentar o contato e reportar ao jurídico antitruste imediatamente',
      'Recusar educadamente sem registrar',
      'Ouvir a proposta sem se comprometer para entender a intenção',
      'Consultar a associação do setor sobre práticas de mercado',
    ],
    idealIndex: 0,
    impacts: { trust: 15, risk: -30, reputation: 30 },
    explanation: 'Qualquer discussão sobre preços com concorrentes pode configurar cartel. Além de recusar, é crucial documentar o contato e reportar ao jurídico, pois a omissão pode ser interpretada como participação.'
  },
  {
    id: 'case-42',
    report: 'Colaborador descobre que a empresa utiliza software pirata em 30% das estações de trabalho, incluindo departamentos que lidam com dados sensíveis.',
    options: [
      'Comprar licenças imediatamente para regularizar',
      'Denunciar à BSA (Business Software Alliance)',
      'Formatar as máquinas irregulares',
      'Avaliar risco jurídico e de segurança, planejar regularização e reforçar política de software autorizado',
    ],
    idealIndex: 3,
    impacts: { trust: 16, risk: -31, reputation: 31 },
    explanation: 'Software pirata gera risco jurídico (multas), de segurança (sem patches) e reputacional. A resposta deve ser planejada: avaliar extensão, regularizar e prevenir reincidência com política e controles.'
  },
  {
    id: 'case-43',
    report: "Durante entrevista de desligamento, ex-funcionário revela que lhe ofereciam 'por fora' 2% do valor de cada contrato que aprovasse. Ele diz que recusou todas as vezes.",
    options: [
      'Agradecer a informação e registrar',
      'Pedir que formalize a denúncia por escrito antes de investigar',
      'Contratar o ex-funcionário como consultor para ajudar na investigação',
      'Investigar quem ofereceu, se outros aprovadores aceitaram e se há contratos comprometidos',
    ],
    idealIndex: 3,
    impacts: { trust: 17, risk: -32, reputation: 32 },
    explanation: 'A revelação indica esquema estruturado de corrupção. É urgente investigar quem oferecia, quantos aprovadores foram abordados e se contratos foram comprometidos — outros podem ter aceitado.'
  },
  {
    id: 'case-44',
    report: 'O departamento de TI implementa monitoramento de e-mails corporativos sem comunicar aos funcionários. Compliance é informado após a implementação.',
    options: [
      'Exigir que antes de continuar o monitoramento, seja publicada política clara e comunicação a todos os colaboradores',
      'Validar pois e-mail corporativo é propriedade da empresa',
      'Desativar o monitoramento imediatamente',
      'Verificar apenas se está em conformidade com a LGPD',
    ],
    idealIndex: 0,
    impacts: { trust: 18, risk: -33, reputation: 33 },
    explanation: 'Mesmo em e-mail corporativo, o monitoramento sem comunicação prévia pode violar expectativa legítima de privacidade e LGPD. A solução não é desativar, mas implementar transparência com política clara.'
  },
  {
    id: 'case-45',
    report: 'Um fornecedor estratégico (único fornecedor de componente crítico) é flagrado com trabalho análogo ao escravo pelo Ministério do Trabalho.',
    options: [
      'Rescindir contrato imediatamente por violação de cláusula anticorrupção',
      'Manter o contrato pois não há alternativa',
      'Avaliar alternativas de fornecimento, estabelecer prazo para remediação e monitorar, com plano de contingência',
      'Suspender compras até regularização completa',
    ],
    idealIndex: 2,
    impacts: { trust: 19, risk: -34, reputation: 12 },
    explanation: 'Com fornecedor único de componente crítico, rescisão imediata pode paralisar operações. A abordagem deve equilibrar ética e continuidade: exigir remediação com prazo, monitorar e buscar alternativas.'
  },
  {
    id: 'case-46',
    report: 'Ao analisar registros de acesso, você nota que o CEO acessa o sistema de RH às 3h da manhã, consultando dados pessoais de funcionários específicos sem justificativa aparente.',
    options: [
      'Não questionar pois o CEO tem acesso a todos os sistemas',
      'Documentar o padrão de acesso e reportar ao presidente do Conselho de Administração',
      'Confrontar o CEO diretamente sobre os acessos',
      'Restringir o acesso do CEO ao sistema de RH',
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -35, reputation: 13 },
    explanation: 'Acessos sem justificativa são red flag, independente do cargo. O CEO não deve ser confrontado diretamente — o reporte deve ir ao Conselho. Restringir acesso sem autorização do Conselho pode gerar conflito.'
  },
  {
    id: 'case-47',
    report: 'Empresa de construção. Engenheiro sênior reporta que materiais utilizados na obra estão abaixo da especificação técnica, comprometendo a segurança estrutural do edifício.',
    options: [
      'Comunicar ao órgão regulador e aos compradores',
      'Substituir os materiais inadequados e continuar',
      'Verificar se o desvio é aceitável dentro das margens de tolerância',
      'Interromper a obra imediatamente e realizar laudo técnico independente',
    ],
    idealIndex: 3,
    impacts: { trust: 21, risk: -36, reputation: 14 },
    explanation: 'Risco à segurança estrutural exige interrupção imediata. Antes de substituir materiais ou comunicar externamente, é necessário laudo independente para dimensionar o risco e definir se há necessidade de demolição parcial.'
  },
  {
    id: 'case-48',
    report: 'Um consultor externo que presta serviços à empresa é também membro do conselho de uma ONG que recebe doações da mesma empresa. Ele vota a favor de aumentar essas doações.',
    options: [
      'Não há conflito pois são atividades independentes',
      'Cancelar a doação à ONG',
      'Exigir que o consultor se abstenha de votar em matérias relacionadas à empresa doadora e divulgue o vínculo',
      'Encerrar o contrato de consultoria',
    ],
    idealIndex: 2,
    impacts: { trust: 22, risk: -37, reputation: 15 },
    explanation: 'Há conflito de interesse claro: o consultor se beneficia indiretamente das doações que a empresa faz à ONG onde ele tem voto. A solução é transparência e abstenção, não necessariamente o fim de nenhuma relação.'
  },
  {
    id: 'case-49',
    report: 'Funcionário descobre que a empresa está armazenando dados de saúde de funcionários (resultados de exames periódicos) no mesmo servidor que dados comerciais, sem criptografia diferenciada.',
    options: [
      'Avaliar a criticidade, classificar os dados e implementar controles proporcionais ao risco',
      'Exigir migração imediata para servidor segregado e criptografado',
      'Reportar à ANPD como incidente de segurança',
      'Comunicar aos funcionários sobre a exposição de seus dados',
    ],
    idealIndex: 0,
    impacts: { trust: 23, risk: -38, reputation: 16 },
    explanation: 'Dados de saúde são sensíveis e exigem proteção especial, mas a resposta deve ser proporcional. Antes de migrar ou notificar, avalie se houve acesso indevido, classifique os dados e implemente controles adequados.'
  },
  {
    id: 'case-50',
    report: "Em treinamento de compliance, um funcionário questiona: 'Se eu denunciar meu chefe e depois não for comprovado nada, posso ser processado por denunciação caluniosa?'",
    options: [
      'Sim, pode ser processado se a denúncia for falsa',
      'Não, o denunciante tem proteção absoluta contra qualquer consequência',
      'O denunciante de boa-fé é protegido; denúncia sabidamente falsa pode ter consequências, mas dúvida genuína é protegida',
      'Orientar que consulte um advogado antes de denunciar',
    ],
    idealIndex: 2,
    impacts: { trust: 24, risk: -39, reputation: 17 },
    explanation: 'A proteção ao denunciante cobre boa-fé, mesmo que a investigação não comprove. Porém, denúncias comprovadamente caluniosas podem ter consequências. A distinção é entre boa-fé e má-fé deliberada.'
  },
  {
    id: 'case-51',
    report: 'Empresa contrata influenciadores digitais para promover produto sem exigir que divulguem a relação comercial nas postagens.',
    options: [
      'Exigir disclosure transparente conforme normas do CONAR e CDC sobre publicidade identificada',
      'É prática comum no mercado e não há regulamentação',
      'Publicar apenas em plataformas que identificam automaticamente conteúdo patrocinado',
      'Criar hashtag corporativa para diferenciar conteúdo orgânico',
    ],
    idealIndex: 0,
    impacts: { trust: 25, risk: -40, reputation: 18 },
    explanation: 'Publicidade disfarçada viola o CDC e normas do CONAR. Independente de prática de mercado, a empresa deve exigir transparência sobre a relação comercial para evitar riscos legais e reputacionais.'
  },
  {
    id: 'case-52',
    report: 'Funcionário pede para trabalhar remotamente de outro país por 6 meses. O gestor aprova, mas ninguém consulta as implicações fiscais, trabalhistas e de proteção de dados.',
    options: [
      'Aprovar pois trabalho remoto é flexível',
      'Negar pois a empresa não tem estrutura para empregados no exterior',
      'Avaliar implicações de permanent establishment fiscal, legislação trabalhista local e transferência internacional de dados antes de autorizar',
      'Consultar apenas o departamento de TI sobre segurança',
    ],
    idealIndex: 2,
    impacts: { trust: 26, risk: -41, reputation: 19 },
    explanation: 'Trabalho remoto internacional pode criar obrigação tributária no país de destino (establishment permanente), sujeitar a empresa à legislação trabalhista local e implicar em transferência internacional de dados sob LGPD.'
  },
  {
    id: 'case-53',
    report: 'O compliance officer descobre que ele próprio cometeu um erro: aprovou uma transação sem perceber que envolvia empresa listada em sanções internacionais.',
    options: [
      'Corrigir silenciosamente e monitorar',
      'Consultar o jurídico sobre como minimizar sua responsabilidade pessoal',
      'Delegar a correção a um subordinado',
      'Auto-reportar o erro ao Conselho, bloquear a transação e avaliar necessidade de comunicação ao regulador',
    ],
    idealIndex: 3,
    impacts: { trust: 27, risk: -42, reputation: 20 },
    explanation: 'A integridade do compliance officer se demonstra na auto-responsabilização. O auto-reporte ao Conselho, o bloqueio da transação e a avaliação regulatória mostram que o programa funciona mesmo quando o próprio CO erra.'
  },
  {
    id: 'case-54',
    report: 'Empresa do ramo alimentício. Funcionário do controle de qualidade relata que lotes com validade próxima ao vencimento estão sendo re-etiquetados com nova data para venda.',
    options: [
      'Verificar se os produtos ainda estão dentro do padrão de qualidade',
      'Recolher os lotes re-etiquetados do mercado e notificar ANVISA e Procon imediatamente',
      'Advertir o responsável pela re-etiquetagem',
      'Implementar desconto para venda rápida dos lotes próximos ao vencimento',
    ],
    idealIndex: 1,
    impacts: { trust: 28, risk: -43, reputation: 21 },
    explanation: 'Re-etiquetagem de validade é fraude ao consumidor e infração sanitária grave com risco à saúde pública. Os lotes devem ser recolhidos e as autoridades notificadas — verificar qualidade depois não protege o consumidor.'
  },
  {
    id: 'case-55',
    report: 'Funcionário do setor fiscal descobre que a empresa vem aplicando crédito tributário de forma agressiva, em interpretação que já foi derrubada pela jurisprudência majoritária dos tribunais.',
    options: [
      'Manter a posição tributária atual pois não é ilegal',
      'Contratar consultoria tributária externa renomada para validar',
      'Recolher a diferença tributária retroativamente',
      'Reavaliar a posição com parecer jurídico atualizado e provisionar contingência adequada nas demonstrações',
    ],
    idealIndex: 3,
    impacts: { trust: 29, risk: -44, reputation: 22 },
    explanation: 'Posição tributária contra jurisprudência majoritária gera contingência fiscal alta. É necessário reavaliar com parecer atualizado, provisionar adequadamente e decidir se mantém o risco ou regulariza.'
  },
  {
    id: 'case-56',
    report: 'Ao revisar contratos antigos, compliance descobre que um contrato de patrocínio esportivo de R$ 5 milhões foi aprovado apenas pelo diretor comercial, sem due diligence no atleta patrocinado.',
    options: [
      'O contrato já foi executado, apenas registrar a falha processual',
      'Comunicar ao Conselho sobre falha de governança',
      'Cancelar o patrocínio por irregularidade processual',
      'Realizar due diligence retroativa no atleta e revisar controles de aprovação para futuros patrocínios',
    ],
    idealIndex: 3,
    impacts: { trust: 30, risk: -45, reputation: 23 },
    explanation: 'Due diligence retroativa pode revelar problemas no patrocinado que ainda geram risco. Além disso, a revisão dos controles evita recorrência. Cancelar contrato executado pode gerar litígio desnecessário.'
  },
  {
    id: 'case-57',
    report: 'Empresa de mineração. Comunidade indígena próxima à operação relata contaminação de rio. Laudos técnicos internos são inconclusivos.',
    options: [
      'Aguardar laudo conclusivo para agir',
      'Contratar laudo independente, implementar medidas preventivas imediatas e dialogar com a comunidade',
      'Comunicar ao IBAMA que os laudos são inconclusivos',
      'Fornecer água potável à comunidade como gesto de boa vontade',
    ],
    idealIndex: 1,
    impacts: { trust: 31, risk: -46, reputation: 24 },
    explanation: 'Laudos inconclusivos não permitem inação. O princípio da precaução exige medidas preventivas imediatas, laudo independente para credibilidade e diálogo transparente com a comunidade afetada.'
  },
  {
    id: 'case-58',
    report: 'Funcionário com acesso privilegiado ao sistema de TI usa suas credenciais para acessar informações pessoais de uma ex-namorada que também é funcionária.',
    options: [
      'Advertir o funcionário e revogar acesso temporariamente',
      'Revogar acessos privilegiados, apurar extensão do uso indevido e avaliar medida disciplinar proporcional',
      'Reportar à polícia como crime cibernético',
      'Comunicar à ex-namorada sobre o acesso indevido',
    ],
    idealIndex: 1,
    impacts: { trust: 32, risk: -47, reputation: 25 },
    explanation: 'Uso indevido de credenciais privilegiadas para fins pessoais é violação grave de segurança. Além de revogar, é preciso apurar toda a extensão do acesso e aplicar medida proporcional.'
  },
  {
    id: 'case-59',
    report: 'Banco descobre que clientes de alta renda estão usando contas da instituição para estruturar depósitos abaixo do limite de comunicação ao COAF.',
    options: [
      'Comunicar ao COAF apenas as operações acima do limite legal',
      'Encerrar as contas dos clientes envolvidos',
      'Comunicar ao COAF como operação suspeita de structuring, independente dos valores individuais',
      'Alertar os clientes que a prática é monitorada',
    ],
    idealIndex: 2,
    impacts: { trust: 33, risk: -48, reputation: 26 },
    explanation: 'Structuring (fracionamento para evitar limites de comunicação) é técnica clássica de lavagem de dinheiro. Deve ser comunicada ao COAF como operação suspeita, independente dos valores individuais.'
  },
  {
    id: 'case-60',
    report: 'Uma startup de saúde digital quer compartilhar dados anonimizados de pacientes com parceiro de pesquisa farmacêutica. A anonimização utiliza apenas remoção de nomes.',
    options: [
      'Autorizar pois os dados estão anonimizados',
      'Exigir consentimento individual de cada paciente',
      'Avaliar se a anonimização é efetiva (se não é possível re-identificação) e se há base legal adequada',
      'Solicitar aprovação do comitê de ética em pesquisa',
    ],
    idealIndex: 2,
    impacts: { trust: 34, risk: -49, reputation: 27 },
    explanation: 'Remoção de nomes não garante anonimização efetiva — dados podem ser re-identificados por combinação de atributos. É necessário avaliar técnicas de anonimização adequadas e base legal específica.'
  },
  {
    id: 'case-61',
    report: "Gestor pressiona equipe para não registrar horas extras no sistema de ponto, argumentando que 'todos fazem isso' e que 'faz parte da cultura da empresa'.",
    options: [
      'Acatar pois é prática comum',
      'Registrar horas extras silenciosamente contra a orientação',
      'Documentar a orientação do gestor e reportar como possível fraude trabalhista e risco de passivo',
      'Discutir com colegas para fazer uma queixa coletiva',
    ],
    idealIndex: 2,
    impacts: { trust: 15, risk: -20, reputation: 28 },
    explanation: 'Não registrar horas extras é fraude trabalhista que gera passivo. A documentação da orientação do gestor é fundamental como evidência, e o reporte formal protege tanto o funcionário quanto a empresa.'
  },
  {
    id: 'case-62',
    report: 'Empresa recebe intimação judicial para preservar todos os e-mails de determinado departamento dos últimos 5 anos. O departamento de TI diz que a política de retenção apaga e-mails após 3 anos.',
    options: [
      'Suspender imediatamente qualquer exclusão (litigation hold), recuperar o que for possível e comunicar ao juízo sobre a situação',
      'Informar ao juízo que os e-mails foram apagados conforme política',
      'Produzir apenas os e-mails disponíveis sem informar sobre os apagados',
      'Alterar a política de retenção para 5 anos retroativamente',
    ],
    idealIndex: 0,
    impacts: { trust: 16, risk: -21, reputation: 29 },
    explanation: 'Litigation hold é obrigação imediata. Destruir evidências após intimação é spoliation. Deve-se preservar o que existe, tentar recuperar o que foi apagado e ser transparente com o juízo sobre a situação.'
  },
  {
    id: 'case-63',
    report: "Funcionário do setor de compras recebe proposta de fornecedor incluindo 'verba de relacionamento' que seria depositada em conta pessoal do comprador como 'consultoria'.",
    options: [
      'Recusar e registrar como tentativa de suborno',
      'Avaliar se o valor é compatível com consultoria real',
      'Denunciar o fornecedor à polícia',
      'Recusar, documentar detalhadamente a proposta e reportar para investigação de possível padrão com outros compradores',
    ],
    idealIndex: 3,
    impacts: { trust: 17, risk: -22, reputation: 30 },
    explanation: 'Além de recusar, é crucial documentar e investigar se outros compradores receberam propostas similares. Um caso isolado pode ser ponta de esquema maior. A documentação detalhada é evidência fundamental.'
  },
  {
    id: 'case-64',
    report: 'Empresa de logística. Motoristas relatam que são obrigados a dirigir além do limite legal de horas para cumprir metas de entrega.',
    options: [
      'Ajustar metas de entrega para serem compatíveis com limites legais de jornada',
      'Contratar mais motoristas para distribuir a demanda',
      'Instalar rastreadores nos caminhões para monitorar jornada',
      'Investigar se a situação é sistêmica, recalibrar rotas e metas, e garantir mecanismos de registro que não possam ser burlados',
    ],
    idealIndex: 3,
    impacts: { trust: 18, risk: -23, reputation: 31 },
    explanation: 'O problema pode ser sistêmico — metas irreais, pressão de gestores, registros fraudados. Instalar rastreadores sem mudar metas apenas documenta a irregularidade. É preciso atacar a causa raiz.'
  },
  {
    id: 'case-65',
    report: 'Ao revisar contratos com governo, compliance descobre que a empresa usa intermediários (brokers) em licitações públicas sem due diligence ou justificativa documentada.',
    options: [
      'Consultar o governo sobre a legalidade dos intermediários',
      'Encerrar todos os contratos com intermediários imediatamente',
      'Aceitar pois intermediários são prática comum em licitações',
      'Realizar due diligence retroativa em todos os intermediários e suspender novas contratações de brokers até implementação de controles',
    ],
    idealIndex: 3,
    impacts: { trust: 19, risk: -24, reputation: 32 },
    explanation: 'Intermediários em licitações públicas são red flag clássico de corrupção. A due diligence retroativa pode revelar problemas existentes, e a suspensão de novas contratações previne riscos até que controles sejam implementados.'
  },
  {
    id: 'case-66',
    report: 'Funcionário nota que a empresa oferece condições comerciais significativamente melhores para clientes que indicam novos clientes, sem limite de bonificação.',
    options: [
      'É estratégia comercial legítima',
      'Avaliar se o programa pode configurar pirâmide financeira ou se os incentivos são proporcionais e sustentáveis',
      'Limitar bonificações a um valor máximo por indicação',
      'Consultar o jurídico sobre legalidade do programa',
    ],
    idealIndex: 1,
    impacts: { trust: 20, risk: -25, reputation: 33 },
    explanation: 'Programas de indicação sem limite podem se aproximar de esquemas de pirâmide. A análise deve verificar se a remuneração é pela indicação real ou pelo recrutamento em cadeia, e se é sustentável.'
  },
  {
    id: 'case-67',
    report: 'Empresa de tecnologia descobre que um algoritmo de precificação dinâmica está cobrando preços mais altos de usuários que acessam via dispositivos Apple.',
    options: [
      'É prática legal de segmentação de mercado',
      'Avaliar se constitui discriminação de preço ilegal e se há transparência adequada ao consumidor',
      'Cobrar o mesmo preço de todos os dispositivos',
      'Comunicar aos usuários que preços variam por dispositivo',
    ],
    idealIndex: 1,
    impacts: { trust: 21, risk: -26, reputation: 12 },
    explanation: 'Precificação diferenciada por dispositivo pode configurar prática abusiva sob CDC e legislações de defesa do consumidor. A análise deve verificar legalidade, proporcionalidade e transparência.'
  },
  {
    id: 'case-68',
    report: 'O sistema de compliance detecta que um PEP (Pessoa Exposta Politicamente) abriu conta na empresa com documentação regular e sem alertas em listas restritivas.',
    options: [
      'Recusar a abertura por ser PEP',
      'Aceitar normalmente pois a documentação está regular',
      'Consultar o Banco Central antes de aceitar',
      'Aceitar com monitoramento reforçado (enhanced due diligence) conforme regulamentação de PLD',
    ],
    idealIndex: 3,
    impacts: { trust: 22, risk: -27, reputation: 13 },
    explanation: 'PEPs não podem ser automaticamente recusados, mas exigem enhanced due diligence e monitoramento contínuo reforçado. A regulamentação de PLD requer tratamento diferenciado, não proibitivo.'
  },
  {
    id: 'case-69',
    report: 'Empresa quer doar R$ 500 mil para campanha política de candidato que prometeu destravar licença ambiental de projeto da empresa.',
    options: [
      'Doar pois é direito de expressão política da empresa',
      'Doar valor menor para reduzir risco',
      'Doar através de fundação da empresa para não vincular diretamente',
      'Recusar a doação pois pode configurar quid pro quo e violação da Lei Anticorrupção',
    ],
    idealIndex: 3,
    impacts: { trust: 23, risk: -28, reputation: 14 },
    explanation: 'Doação empresarial com expectativa de contraprestação governamental configura corrupção. Após 2015, doações corporativas a campanhas são proibidas no Brasil, e mesmo onde permitidas, o quid pro quo é crime.'
  },
  {
    id: 'case-70',
    report: 'Funcionário relata que há câmeras de vigilância dentro dos banheiros do escritório. A empresa alega que é por segurança após furtos.',
    options: [
      'Remover imediatamente as câmeras pois violam dignidade e privacidade, independente da justificativa',
      'Aceitar a justificativa de segurança e manter as câmeras',
      'Manter câmeras apenas nas áreas comuns do banheiro (lavatórios)',
      'Consultar os funcionários sobre preferência',
    ],
    idealIndex: 0,
    impacts: { trust: 24, risk: -29, reputation: 15 },
    explanation: 'Câmeras em banheiros violam a dignidade humana e são ilegais independente de justificativa. A segurança pode ser garantida por outros meios (controle de acesso, câmeras em corredores externos).'
  },
  {
    id: 'case-71',
    report: "Empresa de alimentos usa embalagem com selo 'natural' e '100% integral' em produto que contém 40% de ingredientes refinados.",
    options: [
      'Reformular o produto para corresponder à embalagem',
      "Manter pois não há definição legal precisa de 'natural'",
      'Adequar a embalagem para refletir a composição real do produto',
      'Adicionar asterisco com informação complementar',
    ],
    idealIndex: 2,
    impacts: { trust: 25, risk: -30, reputation: 16 },
    explanation: 'Informação enganosa na embalagem viola o CDC e regulamentações da ANVISA. A prioridade é adequar a comunicação à realidade do produto, não buscar brechas legais.'
  },
  {
    id: 'case-72',
    report: 'Ao investigar uma denúncia, o investigador descobre informações que implicam um segundo caso, não relacionado ao original, envolvendo outro departamento.',
    options: [
      'Registrar a descoberta como nova denúncia e abrir investigação separada com escopo próprio',
      'Ignorar pois está fora do escopo da investigação',
      'Expandir o escopo da investigação atual para cobrir ambos os casos',
      'Informar verbalmente ao compliance officer sem documentar',
    ],
    idealIndex: 0,
    impacts: { trust: 26, risk: -31, reputation: 17 },
    explanation: 'Informações sobre irregularidades não podem ser ignoradas, mas misturar investigações compromete ambas. O correto é abrir caso separado, com escopo e investigador próprios, preservando a integridade de cada apuração.'
  },
  {
    id: 'case-73',
    report: 'Empresa descobre que ex-funcionário levou lista de clientes e base de prospects ao ingressar em concorrente direto.',
    options: [
      'Processar judicialmente por concorrência desleal e violação de segredo comercial',
      'Comunicar aos clientes que suas informações foram comprometidas',
      'Entrar em contato com o concorrente exigindo devolução',
      'Avaliar se havia NDA/cláusula de não-competição vigente e se a informação configura segredo comercial antes de agir',
    ],
    idealIndex: 3,
    impacts: { trust: 27, risk: -32, reputation: 18 },
    explanation: 'Nem toda informação de cliente é segredo comercial protegido judicialmente. Antes de litigar, é preciso verificar se há proteção contratual (NDA, não-competição) e se a informação atende requisitos legais de sigilo.'
  },
  {
    id: 'case-74',
    report: 'Funcionário do setor de investimentos comenta em almoço com amigos que a empresa está prestes a anunciar aquisição milionária. Um dos amigos compra ações da empresa-alvo no dia seguinte.',
    options: [
      'Apurar o vazamento de informação privilegiada e avaliar se há insider trading, envolvendo CVM se necessário',
      'O funcionário não é responsável pela ação do amigo',
      'Advertir o funcionário sobre confidencialidade',
      'Monitorar se o amigo vendeu as ações com lucro',
    ],
    idealIndex: 0,
    impacts: { trust: 28, risk: -33, reputation: 19 },
    explanation: 'Compartilhar informação material não pública que resulta em negociação de valores mobiliários configura insider trading para ambos (tipper e tippee). A CVM deve ser envolvida para investigação formal.'
  },
  {
    id: 'case-75',
    report: 'Empresa quer usar reconhecimento facial para controle de ponto dos funcionários. O sindicato se opõe alegando excesso de vigilância.',
    options: [
      'Realizar DPIA (avaliação de impacto), consultar o sindicato e avaliar alternativas menos invasivas',
      'Implementar pois é tecnologia moderna e eficiente',
      'Desistir do reconhecimento facial por causa da oposição',
      'Implementar apenas para novos funcionários que aceitarem',
    ],
    idealIndex: 0,
    impacts: { trust: 29, risk: -34, reputation: 20 },
    explanation: 'Biometria facial para controle de ponto requer DPIA sob LGPD, negociação sindical e análise de proporcionalidade. Pode haver alternativas menos invasivas (digital, PIN) que atendam o objetivo.'
  },
  {
    id: 'case-76',
    report: "Auditor externo reporta informalmente ao CFO uma irregularidade contábil material. O CFO pede para 'resolver internamente' antes do relatório formal.",
    options: [
      'Aceitar pois é melhor corrigir antes do relatório',
      'O auditor deve manter a independência e reportar a irregularidade conforme normas de auditoria, sem acatar pedido de omissão',
      'Negociar prazo para correção antes de incluir no relatório',
      'Consultar o comitê de auditoria sobre como proceder',
    ],
    idealIndex: 1,
    impacts: { trust: 30, risk: -35, reputation: 21 },
    explanation: 'O auditor tem dever de independência e não pode omitir ou postergar reporte de irregularidade material a pedido da gestão. Isso compromete a integridade da auditoria e pode configurar participação na irregularidade.'
  },
  {
    id: 'case-77',
    report: 'Empresa opera em país onde propina a autoridades é culturalmente aceita e praticamente necessária para operar. Concorrentes locais pagam abertamente.',
    options: [
      'Adaptar-se à cultura local para manter competitividade',
      'Manter posição anticorrupção, investir em relacionamento institucional transparente e aceitar possível perda de negócios',
      "Operar através de parceiro local que 'resolva' questões burocráticas",
      'Contribuir para fundos de desenvolvimento comunitário como alternativa',
    ],
    idealIndex: 1,
    impacts: { trust: 31, risk: -36, reputation: 22 },
    explanation: 'Legislações extraterritoriais (FCPA, UK Bribery Act, Lei Anticorrupção) proíbem propina mesmo onde é culturalmente aceita. A empresa deve competir com integridade, mesmo com desvantagem competitiva.'
  },
  {
    id: 'case-78',
    report: "Funcionário descobre que a empresa mantém dois conjuntos de livros contábeis: um oficial para autoridades e outro 'gerencial' com números reais diferentes.",
    options: [
      "Verificar se o livro 'gerencial' é apenas relatório de gestão com metodologia diferente",
      'Investigar as divergências entre os dois registros e, se houver manipulação intencional, reportar ao Comitê de Auditoria e avaliar comunicação ao MP',
      'Destruir o livro gerencial para eliminar evidência',
      'Contratar perito contábil para reconciliar os dois registros',
    ],
    idealIndex: 1,
    impacts: { trust: 32, risk: -37, reputation: 23 },
    explanation: 'Dois conjuntos de livros com números divergentes pode ser legítimo (IFRS vs gerencial) ou fraude contábil. A investigação deve determinar se as diferenças são metodológicas ou manipulação intencional.'
  },
  {
    id: 'case-79',
    report: 'Empresa de seguros. Analista descobre que o modelo de precificação cobra prêmios mais altos para CEPs de bairros predominantemente negros, sem justificativa atuarial.',
    options: [
      'Auditar o modelo para eliminar viés discriminatório e garantir que variáveis de precificação tenham justificativa atuarial legítima',
      'É prática atuarial baseada em dados de sinistralidade',
      'Proibir uso de CEP na precificação',
      'Aplicar desconto compensatório para CEPs afetados',
    ],
    idealIndex: 0,
    impacts: { trust: 33, risk: -38, reputation: 24 },
    explanation: 'Precificação que resulta em discriminação racial sem justificativa atuarial legítima viola princípios de equidade e pode ser ilegal. O modelo deve ser auditado para eliminar proxies discriminatórios.'
  },
  {
    id: 'case-80',
    report: 'Durante assembleia, acionista minoritário solicita acesso a documentos internos detalhados sobre remuneração individual de diretores e contratos com partes relacionadas.',
    options: [
      'Fornecer informações agregadas e contratos resumidos conforme lei, protegendo dados pessoais e segredos comerciais',
      'Fornecer todos os documentos pois é direito do acionista',
      'Negar acesso pois são informações confidenciais',
      'Consultar a CVM sobre o nível de disclosure obrigatório',
    ],
    idealIndex: 0,
    impacts: { trust: 34, risk: -39, reputation: 25 },
    explanation: 'Acionistas têm direito a informações, mas há limite entre transparência e proteção de dados pessoais/segredos comerciais. O equilíbrio legal exige disclosure adequado sem exposição indevida.'
  },
];

/**
 * Retorna N casos embaralhados para uma sessão de jogo
 * Também embaralha as opções de cada caso, recalculando o índice correto
 */
export const getShuffledWhistleblowerCases = (count: number = 10) => {
  const shuffled = shuffleArray([...expandedWhistleblowerCases]);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map(c => {
    const correctAnswer = c.options[c.idealIndex];
    const shuffledOptions = shuffleArray([...c.options]);
    const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);
    return { ...c, options: shuffledOptions, correctIndex: newCorrectIndex };
  });
};
