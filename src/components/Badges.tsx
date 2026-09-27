import type { CostCategory, FitScore, PrivacyCategory } from '@/types';
import { fitLabel } from '@/logic/decision';

export function FitBadge({ score, size = 'md' }: { score: FitScore; size?: 'sm' | 'md' }) {
  const colors: Record<number, string> = {
    1: 'bg-error-soft text-error',
    2: 'bg-warning-soft text-warning',
    3: 'bg-warning-soft text-warning',
    4: 'bg-success-soft text-success',
    5: 'bg-success-soft text-success',
  };
  const dot: Record<number, string> = {
    1: 'bg-error',
    2: 'bg-warning',
    3: 'bg-warning',
    4: 'bg-success',
    5: 'bg-success',
  };
  return (
    <span className={`chip ${colors[score]} ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[score]}`} />
      {fitLabel(score)}
    </span>
  );
}

export function CostBadge({ category }: { category: CostCategory }) {
  const labels: Record<CostCategory, string> = {
    free: 'Free',
    freemium: 'Freemium',
    paid: 'Paid',
    enterprise: 'Enterprise',
  };
  const colors: Record<CostCategory, string> = {
    free: 'bg-success-soft text-success',
    freemium: 'bg-accent-soft text-accent',
    paid: 'bg-warning-soft text-warning',
    enterprise: 'bg-surface-subtle text-ink-soft',
  };
  return <span className={`chip ${colors[category]}`}>{labels[category]}</span>;
}

export function PrivacyBadge({ category }: { category: PrivacyCategory }) {
  const labels: Record<PrivacyCategory, string> = {
    minimal: 'Minimal exposure',
    moderate: 'Moderate exposure',
    elevated: 'Elevated exposure',
  };
  const colors: Record<PrivacyCategory, string> = {
    minimal: 'bg-success-soft text-success',
    moderate: 'bg-warning-soft text-warning',
    elevated: 'bg-error-soft text-error',
  };
  return <span className={`chip ${colors[category]}`}>{labels[category]}</span>;
}

export function FitMeter({ score }: { score: FitScore }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-full max-w-[14px] rounded-full transition-colors duration-300 ${
            i <= score
              ? score >= 4
                ? 'bg-success'
                : score >= 3
                ? 'bg-warning'
                : 'bg-error'
              : 'bg-surface-border'
          }`}
        />
      ))}
    </div>
  );
}
