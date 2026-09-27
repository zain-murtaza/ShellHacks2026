import { AppProvider, useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { StepProgress } from '@/components/StepProgress';
import { LandingScreen } from '@/screens/LandingScreen';
import { SetupScreen } from '@/screens/SetupScreen';
import { ComparisonScreen } from '@/screens/ComparisonScreen';
import { PrivacyScreen } from '@/screens/PrivacyScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import type { Screen } from '@/types';

const flowScreens: Screen[] = ['setup', 'comparison', 'privacy', 'result'];

function AppContent() {
  const { screen } = useApp();

  const showProgress = flowScreens.includes(screen);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      {showProgress && (
        <div className="border-b border-surface-hairline bg-surface/60 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
            <StepProgress current={screen} />
          </div>
        </div>
      )}
      <main>
        {screen === 'landing' && <LandingScreen />}
        {screen === 'setup' && <SetupScreen />}
        {screen === 'comparison' && <ComparisonScreen />}
        {screen === 'privacy' && <PrivacyScreen />}
        {screen === 'result' && <ResultScreen />}
      </main>
      <footer className="border-t border-surface-hairline py-6 text-center">
        <p className="text-xs text-ink-faint">
          AI Decision Centre · ShellHacks 2026 · Privacy-first AI tool selection
        </p>
        <p className="mt-1 text-[11px] text-ink-faint/70">
          Decision engine powered by Gemini · Voice briefing by ElevenLabs
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
