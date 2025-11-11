import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Scale, Lock, Heart, CheckCircle, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import primaQualitaLogo from '@/assets/logo-prima-qualita-animated.png';

interface WelcomeScreenProps {
  onEnter: () => void;
}

/**
 * Tela de boas-vindas do módulo de gamificação
 */
export const WelcomeScreen = ({ onEnter }: WelcomeScreenProps) => {
  const navigate = useNavigate();

  // Ícones flutuantes de fundo
  const floatingIcons = [
    { Icon: Shield, delay: 0, x: '10%', y: '20%' },
    { Icon: Scale, delay: 0.2, x: '80%', y: '15%' },
    { Icon: Lock, delay: 0.4, x: '15%', y: '70%' },
    { Icon: Heart, delay: 0.6, x: '85%', y: '75%' },
    { Icon: CheckCircle, delay: 0.8, x: '50%', y: '10%' },
    { Icon: Users, delay: 1, x: '90%', y: '45%' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Botão voltar */}
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="absolute top-4 left-4 z-20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar ao Dashboard
      </Button>

      {/* Ícones flutuantes de fundo */}
      {floatingIcons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute text-primary/10"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{
            delay,
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon className="w-16 h-16" />
        </motion.div>
      ))}

      {/* Conteúdo principal */}
      <div className="max-w-4xl mx-auto px-4 text-center z-10">
        {/* Logo animado */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [-3, 3, -3],
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="inline-block"
          >
            <img 
              src={primaQualitaLogo} 
              alt="Prima Qualitá Saúde" 
              className="w-64 h-auto mx-auto drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent"
        >
          Bem-vindo ao
          <br />
          CompliancePlay
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-xl md:text-2xl text-muted-foreground mb-12"
        >
          Aprenda brincando. Pratique integridade. Construa confiança.
        </motion.p>

        {/* Botão principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Button
            onClick={onEnter}
            size="lg"
            className="text-lg px-12 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar nas Missões
          </Button>
        </motion.div>

        {/* Texto de apoio */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-sm text-muted-foreground mt-12 max-w-2xl mx-auto"
        >
          Este espaço é acessível a colaboradores, gestores e fornecedores.
          <br />
          Todos podem jogar e fortalecer a cultura de compliance.
        </motion.p>
      </div>
    </div>
  );
};
