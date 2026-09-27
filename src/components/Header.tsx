import { Brain } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Header() {
  const { navigate, savedDecisions } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-hairline bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-surface">
            <Brain className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            AI Decision Centre
          </span>
        </button>

        <div className="flex items-center gap-2">
          {savedDecisions.length > 0 && (
            <span className="chip bg-surface-subtle text-ink-muted">
              {savedDecisions.length} saved
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
