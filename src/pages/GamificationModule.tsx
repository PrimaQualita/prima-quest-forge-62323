import { useState } from 'react';
import { WelcomeScreen } from '@/features/gamification/screens/WelcomeScreen';
import { MissionsMenu } from '@/features/gamification/screens/MissionsMenu';
import { IntegrityMissionGame } from '@/features/gamification/games/IntegrityMissionGame';
import { RiskHuntGame } from '@/features/gamification/games/RiskHuntGame';
import { EthicsQuizGame } from '@/features/gamification/games/EthicsQuizGame';
import { DataGuardianGame } from '@/features/gamification/games/DataGuardianGame';
import { WhistleblowerGame } from '@/features/gamification/games/WhistleblowerGame';
import { ComplianceTycoonGame } from '@/features/gamification/games/ComplianceTycoonGame';

type Screen = 'welcome' | 'menu' | 'integrity-mission' | 'risk-hunt' | 'ethics-quiz' | 'data-guardian' | 'whistleblower-decision' | 'compliance-tycoon';

const GamificationModule = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onEnter={() => setCurrentScreen('menu')} />;
      case 'menu':
        return <MissionsMenu onSelectGame={(id) => setCurrentScreen(id as Screen)} onBack={() => setCurrentScreen('welcome')} />;
      case 'integrity-mission':
        return <IntegrityMissionGame onExit={() => setCurrentScreen('menu')} />;
      case 'risk-hunt':
        return <RiskHuntGame onExit={() => setCurrentScreen('menu')} />;
      case 'ethics-quiz':
        return <EthicsQuizGame onExit={() => setCurrentScreen('menu')} />;
      case 'data-guardian':
        return <DataGuardianGame onExit={() => setCurrentScreen('menu')} />;
      case 'whistleblower-decision':
        return <WhistleblowerGame onExit={() => setCurrentScreen('menu')} />;
      case 'compliance-tycoon':
        return <ComplianceTycoonGame onExit={() => setCurrentScreen('menu')} />;
      default:
        return <WelcomeScreen onEnter={() => setCurrentScreen('menu')} />;
    }
  };

  return <>{renderScreen()}</>;
};

export default GamificationModule;
