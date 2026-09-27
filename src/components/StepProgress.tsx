import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Screen } from '@/types';

const steps: { screen: Screen; label: string }[] = [
  { screen: 'setup', label: 'Setup' },
  { screen: 'comparison', label: 'Compare' },
  { screen: 'privacy', label: 'Privacy' },
  { screen: 'result', label: 'Result' },
];

const order: Screen[] = ['setup', 'comparison', 'privacy', 'result'];

export function StepProgress({ current }: { current: Screen }) {
  const { navigate } = useApp();
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((step, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={step.screen} className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => navigate(step.screen)}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-accent text-white'
                    : isDone
                    ? 'bg-success text-white'
                    : 'bg-surface-subtle text-ink-faint'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isActive ? 'text-ink' : isDone ? 'text-ink-soft' : 'text-ink-faint'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-ink-faint" />
            )}
          </div>
        );
      })}
    </div>
  );
}
