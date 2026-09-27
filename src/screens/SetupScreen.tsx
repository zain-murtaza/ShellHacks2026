import { useState } from 'react';
import {
  Search, PenLine, Code, Image, BookOpen, Users,
  DollarSign, ShieldAlert, Target, ArrowRight, Check, Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { TaskCategory, BudgetTier, SensitivityLevel, Priority } from '@/types';

const tasks: { id: TaskCategory; label: string; icon: typeof Search }[] = [
  { id: 'research', label: 'Research', icon: Search },
  { id: 'writing', label: 'Writing', icon: PenLine },
  { id: 'coding', label: 'Coding', icon: Code },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'meetings', label: 'Meetings', icon: Users },
];

const budgets: { id: BudgetTier; label: string }[] = [
  { id: 'free', label: 'Free' },
  { id: 'under10', label: 'Under $10' },
  { id: 'under25', label: 'Under $25' },
  { id: 'under50', label: 'Under $50' },
];

const sensitivities: { id: SensitivityLevel; label: string; desc: string }[] = [
  { id: 'low', label: 'Low', desc: 'Public or non-sensitive content' },
  { id: 'medium', label: 'Medium', desc: 'Some personal or academic data' },
  { id: 'high', label: 'High', desc: 'Confidential or regulated data' },
];

const priorities: { id: Priority; label: string; desc: string }[] = [
  { id: 'capability', label: 'Capability', desc: 'Best results above all' },
  { id: 'privacy', label: 'Privacy', desc: 'Data safety first' },
  { id: 'cost', label: 'Cost', desc: 'Cheapest viable option' },
  { id: 'balanced', label: 'Balanced', desc: 'Even trade-offs' },
];

export function SetupScreen() {
  const { config, updateConfig, navigate, computeResult, analysis } = useApp();
  const [touched, setTouched] = useState(false);

  const ready = config.task && config.budget && config.sensitivity && config.priority;
  const isLoading = analysis.status === 'loading';

  const handleAnalyse = () => {
    if (!ready) {
      setTouched(true);
      return;
    }
    computeResult();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Decision Setup
        </h1>
        <p className="mt-2 text-ink-muted">
          Tell us what you're working on. We'll find the right AI tool for the job.
        </p>
      </div>

      {/* Task */}
      <div className="mt-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <span className="section-label">What are you working on?</span>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {tasks.map((t) => {
            const active = config.task === t.id;
            return (
              <button
                key={t.id}
                onClick={() => updateConfig({ task: t.id })}
                className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-accent bg-accent-soft shadow-sm'
                    : 'border-surface-border bg-surface hover:border-ink-faint hover:bg-surface-subtle'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  active ? 'bg-accent text-white' : 'bg-surface-subtle text-ink-soft'
                }`}>
                  <t.icon className="h-4 w-4" strokeWidth={2} />
                </div>
                <span className={`text-sm font-medium ${active ? 'text-ink' : 'text-ink-soft'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <span className="section-label">Budget</span>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {budgets.map((b) => {
            const active = config.budget === b.id;
            return (
              <button
                key={b.id}
                onClick={() => updateConfig({ budget: b.id })}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-surface-border bg-surface text-ink-soft hover:border-ink-faint hover:bg-surface-subtle'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sensitivity */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '180ms' }}>
        <span className="section-label">Data sensitivity</span>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {sensitivities.map((s) => {
            const active = config.sensitivity === s.id;
            return (
              <button
                key={s.id}
                onClick={() => updateConfig({ sensitivity: s.id })}
                className={`rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-accent bg-accent-soft shadow-sm'
                    : 'border-surface-border bg-surface hover:border-ink-faint hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${active ? 'text-accent' : 'text-ink-faint'}`} />
                  <span className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink-soft'}`}>
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <span className="section-label">What matters most?</span>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {priorities.map((p) => {
            const active = config.priority === p.id;
            return (
              <button
                key={p.id}
                onClick={() => updateConfig({ priority: p.id })}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'border-accent bg-accent-soft shadow-sm'
                    : 'border-surface-border bg-surface hover:border-ink-faint hover:bg-surface-subtle'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  active ? 'bg-accent text-white' : 'bg-surface-subtle text-ink-soft'
                }`}>
                  <Target className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink-soft'}`}>
                    {p.label}
                  </span>
                  <p className="text-xs text-ink-muted">{p.desc}</p>
                </div>
                {active && <Check className="ml-auto h-4 w-4 text-accent" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="mt-10 flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
        {touched && !ready && (
          <p className="text-sm text-error">Please complete all four selections above.</p>
        )}
        <button
          onClick={handleAnalyse}
          disabled={isLoading}
          className="btn-primary group w-full justify-center px-7 py-3.5 text-[15px] sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              Analyse My Options
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <button
          onClick={() => navigate('comparison')}
          className="btn-ghost text-sm"
        >
          Skip and browse all tools
        </button>
      </div>
    </div>
  );
}
