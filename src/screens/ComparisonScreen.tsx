import { useMemo } from 'react';
import { ExternalLink, ArrowRight, Filter, Database, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { taskLabels } from '@/data/aiTools';
import { FitBadge, CostBadge, PrivacyBadge, FitMeter } from '@/components/Badges';
import { scoreTool, filterEligibleTools } from '@/logic/decision';
import type { TaskCategory } from '@/types';

export function ComparisonScreen() {
  const { config, navigate, tools, toolsLoaded } = useApp();

  const ranked = useMemo(() => {
    if (!config.task || !config.priority) {
      return tools.map((t) => ({ tool: t, score: 0 }));
    }
    return [...tools]
      .map((t) => ({ tool: t, score: scoreTool(t, config) }))
      .sort((a, b) => b.score - a.score);
  }, [config, tools]);

  const eligible = useMemo(() => {
    if (!config.budget || !config.sensitivity) return tools;
    return filterEligibleTools(config);
  }, [config, tools]);

  const eligibleIds = new Set(eligible.map((t) => t.id));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          AI Comparison
        </h1>
        <p className="mt-2 text-ink-muted">
          {config.task
            ? `Ranked for ${taskLabels[config.task as TaskCategory]} with your current filters.`
            : 'Browse all tools. Set up a decision to get personalised rankings.'}
        </p>
      </div>

      {/* Data source indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-ink-faint animate-fade-up" style={{ animationDelay: '30ms' }}>
        {toolsLoaded ? (
          <>
            <Database className="h-3.5 w-3.5" />
            <span>Tool data loaded from database</span>
          </>
        ) : (
          <>
            <Database className="h-3.5 w-3.5" />
            <span>Using cached tool data</span>
          </>
        )}
        <span className="text-surface-border">·</span>
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI reasoning applied during analysis</span>
      </div>

      {/* Filter summary */}
      {(config.task || config.budget || config.sensitivity || config.priority) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <Filter className="h-3.5 w-3.5 text-ink-faint" />
          <span className="text-xs font-medium text-ink-faint">Filters:</span>
          {config.task && <span className="chip bg-accent-soft text-accent">{taskLabels[config.task]}</span>}
          {config.budget && <span className="chip bg-surface-subtle text-ink-soft">{config.budget === 'free' ? 'Free' : `Under $${config.budget.replace('under', '')}`}</span>}
          {config.sensitivity && <span className="chip bg-surface-subtle text-ink-soft capitalize">{config.sensitivity} sensitivity</span>}
          {config.priority && <span className="chip bg-surface-subtle text-ink-soft capitalize">{config.priority} priority</span>}
        </div>
      )}

      {/* Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ranked.map(({ tool, score }, i) => {
          const isEligible = eligibleIds.has(tool.id);
          return (
            <div
              key={tool.id}
              className={`card card-hover animate-fade-up flex flex-col p-5 ${
                !isEligible ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-ink">{tool.name}</h3>
                  <p className="text-xs text-ink-faint">{tool.vendor}</p>
                </div>
                {config.task && config.priority && score > 0 && (
                  <div className="text-right">
                    <span className="text-lg font-semibold text-ink">{Math.round(score)}</span>
                    <span className="text-xs text-ink-faint"> /100</span>
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-ink-muted">{tool.tagline}</p>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                <CostBadge category={tool.costCategory} />
                <PrivacyBadge category={tool.privacyCategory} />
              </div>

              {/* Task fit for selected task */}
              {config.task && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-faint">Fit for {taskLabels[config.task]}</span>
                    <FitBadge score={tool.taskFit[config.task]} size="sm" />
                  </div>
                  <div className="mt-1.5">
                    <FitMeter score={tool.taskFit[config.task]} />
                  </div>
                </div>
              )}

              {/* Structured facts section */}
              <div className="mt-4 space-y-3 border-t border-surface-hairline pt-4">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3 w-3 text-ink-faint" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Structured data</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink-faint">Price</span>
                  <p className="mt-0.5 text-sm text-ink-soft">{tool.priceNote}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink-faint">Privacy</span>
                  <p className="mt-0.5 text-sm text-ink-soft">{tool.privacyNote}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-ink-faint">Strongest use case</span>
                  <p className="mt-0.5 text-sm text-ink-soft">{tool.strongestUseCase}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4">
                {!isEligible && (
                  <p className="mb-2 text-xs text-warning">
                    Excluded by your budget or sensitivity filters
                  </p>
                )}
                <a
                  href={tool.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-70"
                >
                  <ExternalLink className="h-3 w-3" />
                  View privacy source
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => navigate('setup')}
          className="btn-secondary"
        >
          Adjust my filters
        </button>
        <button
          onClick={() => navigate('privacy')}
          className="btn-primary group"
        >
          Open Privacy Gate
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
