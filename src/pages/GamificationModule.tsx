import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '@/features/gamification/screens/WelcomeScreen';
import { MissionsMenu } from '@/features/gamification/screens/MissionsMenu';
import { IntegrityMissionGame } from '@/features/gamification/games/IntegrityMissionGame';
import { ComplianceRunnerGame } from '@/features/gamification/games/ComplianceRunnerGame';
import { EthicsQuizGame } from '@/features/gamification/games/EthicsQuizGame';
import { DataGuardianGame } from '@/features/gamification/games/DataGuardianGame';
import { WhistleblowerGame } from '@/features/gamification/games/WhistleblowerGame';
import { GameInstructions } from '@/features/gamification/components/GameInstructions';

type Screen = 'welcome' | 'menu' | 'instructions' | 'integrity-mission' | 'compliance-runner' | 'ethics-quiz' | 'data-guardian' | 'whistleblower-decision';

const GamificationModule = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedGame, setSelectedGame] = useState<string>('');

  // Função para voltar ao dashboard/menu principal
  const handleBackToMain = () => {
    navigate('/');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onEnter={() => setCurrentScreen('menu')} />;
      case 'menu':
        return <MissionsMenu onSelectGame={(id) => { setSelectedGame(id); setCurrentScreen('instructions'); }} onBack={handleBackToMain} />;
      case 'instructions':
        return <GameInstructions gameId={selectedGame} onStart={() => setCurrentScreen(selectedGame as Screen)} onBack={() => setCurrentScreen('menu')} />;
      case 'integrity-mission':
        return <IntegrityMissionGame onExit={() => setCurrentScreen('menu')} />;
      case 'compliance-runner':
        return <ComplianceRunnerGame onExit={() => setCurrentScreen('menu')} />;
      case 'ethics-quiz':
        return <EthicsQuizGame onExit={() => setCurrentScreen('menu')} />;
      case 'data-guardian':
        return <DataGuardianGame onExit={() => setCurrentScreen('menu')} />;
      case 'whistleblower-decision':
        return <WhistleblowerGame onExit={() => setCurrentScreen('menu')} />;
      default:
        return <WelcomeScreen onEnter={() => setCurrentScreen('menu')} />;
    }
  };

  return <>{renderScreen()}</>;
};

export default GamificationModule;
