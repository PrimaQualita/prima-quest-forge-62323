import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface GameInstructionsProps {
  gameId: string;
  onStart: () => void;
  onBack: () => void;
}

const instructionsData: Record<string, {
  title: string;
  icon: string;
  difficulty: string;
  objectives: string[];
  howToPlay: string[];
  scoring: string[];
  tips: string[];
}> = {
  'integrity-mission': {
    title: 'Missão Integridade',
    icon: '🎯',
    difficulty: 'Fácil',
    objectives: [
      'Tomar decisões éticas em cenários profissionais',
      'Compreender dilemas de integridade no ambiente corporativo',
      'Aplicar princípios do Código de Ética'
    ],
    howToPlay: [
      'Leia cada cenário com atenção',
      'Analise as 4 opções de ação disponíveis',
      'Escolha a alternativa mais ética e íntegra',
      'Clique em "Confirmar" para ver se acertou',
      'Leia a explicação para entender o raciocínio correto',
      'Continue para o próximo cenário'
    ],
    scoring: [
      '25 pontos por cada resposta correta',
      'Medalha especial se acertar 75% ou mais',
      'Sem penalidade por erros - foco é aprender!'
    ],
    tips: [
      'Pense sempre no interesse da organização e da sociedade',
      'Considere consequências de longo prazo, não atalhos',
      'Quando em dúvida, escolha transparência e honestidade'
    ]
  },
  'compliance-runner': {
    title: 'Corrida Compliance',
    icon: '🏃',
    difficulty: 'Intermediário',
    objectives: [
      'Responder perguntas sobre regulamentos institucionais',
      'Avançar por 4 fases com dificuldade crescente',
      'Acumular pontos XP em cada desafio completado'
    ],
    howToPlay: [
      'Clique em "Avançar" para correr até o próximo desafio',
      'Responda corretamente a pergunta sobre regulamentos',
      'Complete todos os desafios da fase atual',
      'Avance para a próxima fase com mais desafios e recompensas',
      'Perguntas nunca se repetem durante o jogo'
    ],
    scoring: [
      'Fase 1 (Iniciante): 20 XP por desafio - 5 desafios',
      'Fase 2 (Intermediário): 30 XP por desafio - 7 desafios',
      'Fase 3 (Avançado): 50 XP por desafio - 10 desafios',
      'Fase 4 (Mestre): 75 XP por desafio - 12 desafios'
    ],
    tips: [
      'Leia cada pergunta com atenção antes de responder',
      'Complete todas as 4 fases para maximizar seus pontos',
      'Respostas erradas não dão pontos - pense bem!',
      'Revise os regulamentos institucionais para melhor performance'
    ]
  },
  'ethics-quiz': {
    title: 'Quiz da Ética',
    icon: '❓',
    difficulty: 'Fácil',
    objectives: [
      'Testar conhecimentos sobre ética empresarial',
      'Reforçar conceitos de LGPD e proteção de dados',
      'Avaliar compreensão de integridade corporativa'
    ],
    howToPlay: [
      'Leia cada pergunta com atenção',
      'Você tem 30 segundos para responder cada questão',
      'Escolha uma das 4 alternativas',
      'Clique em "Confirmar" antes do tempo acabar',
      'Veja feedback imediato e explicação',
      'Complete todas as 4 perguntas da rodada'
    ],
    scoring: [
      '15 pontos por resposta correta',
      '+10 pontos de bônus se sobrar mais de 15 segundos',
      'Questões mudam a cada rodada - jogue novamente!'
    ],
    tips: [
      'Leia todas as alternativas antes de escolher',
      'Gerencie bem o tempo - não deixe esgotar',
      'Atenção aos detalhes nas perguntas'
    ]
  },
  'data-guardian': {
    title: 'Guardião dos Dados',
    icon: '🛡️',
    difficulty: 'Intermediário',
    objectives: [
      'Proteger dados pessoais de ameaças cibernéticas',
      'Compreender princípios de segurança da informação',
      'Aplicar boas práticas de proteção de dados (LGPD)'
    ],
    howToPlay: [
      'Dados pessoais surgem na tela de diversas formas',
      'Clique nos dados PESSOAIS para protegê-los (ícone de escudo)',
      'NÃO clique em ameaças (hackers/vírus) - elas desaparecem sozinhas',
      'Use o ícone de escudo na lateral para proteção extra se necessário',
      'Evite que 5 dados sejam comprometidos',
      'Quanto mais dados proteger, maior sua pontuação'
    ],
    scoring: [
      '10 pontos por cada dado protegido corretamente',
      '-10 pontos por clicar em ameaças',
      'Medalha "Guardião de Dados" com excelente desempenho'
    ],
    tips: [
      'Aja rápido - dados descem pela tela continuamente',
      'Foque em proteger dados, ignore as ameaças',
      'Priorize dados que estão mais abaixo na tela'
    ]
  },
  'whistleblower-decision': {
    title: 'Canal de Denúncias',
    icon: '📢',
    difficulty: 'Avançado',
    objectives: [
      'Tomar decisões sobre gestão de denúncias',
      'Equilibrar confidencialidade, investigação e ação',
      'Compreender importância de canais de denúncia efetivos'
    ],
    howToPlay: [
      'Leia cada denúncia recebida atentamente',
      'Analise as 4 opções de tratamento disponíveis',
      'Escolha a ação mais adequada',
      'Clique em "Confirmar" para ver o impacto',
      'Acompanhe métricas: Confiança, Risco e Reputação',
      'Complete os 4 casos para finalizar'
    ],
    scoring: [
      'Pontuação baseada em 3 métricas: Confiança, Segurança e Reputação',
      'Decisões corretas aumentam métricas',
      'Decisões inadequadas prejudicam métricas',
      'Medalha "Guardião do Canal" com bom desempenho'
    ],
    tips: [
      'Priorize sempre a investigação adequada',
      'Preserve sigilo e proteja denunciantes',
      'Aja com urgência em casos graves (assédio, corrupção)'
    ]
  },
  'compliance-tycoon': {
    title: 'Compliance Tycoon',
    icon: '💼',
    difficulty: 'Avançado',
    objectives: [
      'Gerenciar recursos para construir programa de compliance',
      'Equilibrar orçamento, tempo e resultados',
      'Desenvolver maturidade do programa de integridade'
    ],
    howToPlay: [
      'Você tem 5 rodadas para desenvolver o programa',
      'Cada rodada fornece 100 de Orçamento e 100 de Tempo',
      'Escolha ações para executar (cada uma consome recursos)',
      'Clique em "Executar" APENAS UMA VEZ por ação desejada',
      'Acompanhe 4 métricas: Compliance, Reputação, Engajamento e Maturidade',
      'Clique em "Próxima Rodada" quando terminar',
      'Ao final de 5 rodadas, veja a maturidade do programa'
    ],
    scoring: [
      'Pontuação final baseada na média das 4 métricas',
      'Objetivo: alcançar nível "Avançado" (média 80+)',
      'Cada ação impacta métricas diferentemente',
      'Medalha "Estrategista Compliance" com alta maturidade'
    ],
    tips: [
      'Planeje bem - recursos são limitados por rodada',
      'Balance investimentos entre todas as métricas',
      'Ações mais caras geralmente têm mais impacto',
      'Clique "Executar" apenas UMA vez - aguarde a atualização visual'
    ]
  }
};

export const GameInstructions = ({ gameId, onStart, onBack }: GameInstructionsProps) => {
  const instructions = instructionsData[gameId];

  if (!instructions) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="p-8">
            <p>Instruções não disponíveis para este jogo.</p>
            <Button onClick={onBack} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Card>
          <CardHeader className="text-center border-b">
            <div className="text-6xl mb-4">{instructions.icon}</div>
            <CardTitle className="text-3xl mb-2">{instructions.title}</CardTitle>
            <Badge variant="outline" className="mx-auto">
              Dificuldade: {instructions.difficulty}
            </Badge>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Objetivos */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Objetivos
              </h3>
              <ul className="space-y-2">
                {instructions.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Como Jogar */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                Como Jogar
              </h3>
              <ol className="space-y-2">
                {instructions.howToPlay.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sistema de Pontuação */}
            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Sistema de Pontuação
              </h3>
              <ul className="space-y-2">
                {instructions.scoring.map((score, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">★</span>
                    <span className="text-muted-foreground">{score}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dicas */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Dicas para Sucesso
              </h3>
              <ul className="space-y-2">
                {instructions.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={onBack} className="flex-1">
                Voltar
              </Button>
              <Button onClick={onStart} className="flex-1" size="lg">
                Começar Jogo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
