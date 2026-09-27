import { useState, useRef } from 'react';
import {
  Check, Bookmark, Volume2, ArrowLeft, ExternalLink,
  Workflow, DollarSign, ShieldCheck, Target, FileText,
  Sparkles, Loader2, AlertCircle, Info, Globe, Lock,
  Play, Pause,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FitBadge, CostBadge, PrivacyBadge } from '@/components/Badges';
import { taskLabels } from '@/data/aiTools';
import type { BriefingStatus, PrivacyCategory } from '@/types';
import { buildBriefingText, generateBriefing } from '@/lib/voiceService';

const privacyLabel: Record<PrivacyCategory, string> = {
  minimal: 'Minimal exposure',
  moderate: 'Moderate exposure',
  elevated: 'Elevated exposure',
};

const privacyColor: Record<PrivacyCategory, string> = {
  minimal: 'text-success',
  moderate: 'text-warning',
  elevated: 'text-error',
};

export function ResultScreen() {
  const { result, config, navigate, saveDecision, savedDecisions, analysis, saveStatus } = useApp();
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>('idle');
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (analysis.status === 'loading' && !result) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft">
              <Loader2 className="h-7 w-7 animate-spin text-accent" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">Analysing your options</h2>
            <p className="mt-1 text-sm text-ink-muted">
              The decision engine is reasoning over your preferences and candidate tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-ink-muted">No decision has been computed yet.</p>
        <button onClick={() => navigate('setup')} className="btn-primary mt-4">
          Start a Decision
        </button>
      </div>
    );
  }

  const alreadySaved = savedDecisions.some(
    (d) => d.tool.id === result.tool.id
  );

  const handleSave = () => {
    if (!alreadySaved && saveStatus !== 'saving' && saveStatus !== 'saved') {
      saveDecision(result);
    }
  };

  const handleBriefing = async () => {
    if (briefingStatus === 'generating') return;

    setBriefingStatus('generating');
    setBriefingError(null);

    const text = buildBriefingText(result, config);
    const res = await generateBriefing(text);

    if ('error' in res) {
      if (res.error.includes('not configured')) {
        setBriefingStatus('unavailable');
      } else {
        setBriefingStatus('error');
        setBriefingError(res.error);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = res.audioUrl;
      audioRef.current.play().catch(() => {
        setBriefingStatus('error');
        setBriefingError('Unable to play audio');
      });
    }
    setBriefingStatus('playing');
  };

  const handleStopBriefing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setBriefingStatus('idle');
  };

  const isGemini = result.source === 'gemini';
  const officialUrl = result.tool.officialUrl ?? null;
  const pricingUrl = result.tool.pricingUrl ?? null;
  const privacyUrl = result.tool.privacyUrl ?? result.sourceUrl;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <audio ref={audioRef} onEnded={() => setBriefingStatus('idle')} />

      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="section-label">Your recommendation</span>
          {isGemini ? (
            <span className="chip bg-accent-soft text-accent">
              <Sparkles className="h-3 w-3" />
              AI-powered
            </span>
          ) : (
            <span className="chip bg-surface-subtle text-ink-muted">
              <Info className="h-3 w-3" />
              Local analysis
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {result.tool.name}
        </h1>
        <p className="mt-1 text-ink-muted">{result.tool.tagline}</p>
      </div>

      {/* Fallback notice */}
      {analysis.status === 'fallback' && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-ink">Using local analysis</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              The AI decision engine is unavailable, so we've applied our built-in ranking algorithm instead.
            </p>
          </div>
        </div>
      )}

      {/* Confidence indicator */}
      {result.confidence != null && (
        <div className="mt-4 animate-fade-up" style={{ animationDelay: '30ms' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-faint">Confidence</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink-soft">{Math.round(result.confidence * 100)}%</span>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="mt-6 card animate-fade-up overflow-hidden" style={{ animationDelay: '60ms' }}>
        {/* Top section */}
        <div className="border-b border-surface-hairline p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <FitBadge score={result.taskFit} />
            <CostBadge category={result.tool.costCategory} />
            <PrivacyBadge category={result.dataExposure} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="section-label">Task fit</span>
                <p className="mt-0.5 text-sm font-medium text-ink">
                  {config.task ? taskLabels[config.task] : '—'} · {result.taskFit}/5
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <span className="section-label">Estimated cost</span>
                <p className="mt-0.5 text-sm font-medium text-ink">{result.estimatedCost}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle">
                <ShieldCheck className={`h-4 w-4 ${privacyColor[result.dataExposure]}`} />
              </div>
              <div>
                <span className="section-label">Data exposure</span>
                <p className={`mt-0.5 text-sm font-medium ${privacyColor[result.dataExposure]}`}>
                  {privacyLabel[result.dataExposure]}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-subtle">
                <Workflow className="h-4 w-4 text-ink-soft" />
              </div>
              <div>
                <span className="section-label">Workflow</span>
                <p className="mt-0.5 text-sm font-medium text-ink">{result.tool.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended workflow */}
        <div className="border-b border-surface-hairline p-6 sm:p-8">
          <span className="section-label">Recommended workflow</span>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{result.workflow}</p>
        </div>

        {/* AI Reasoning */}
        <div className="border-b border-surface-hairline p-6 sm:p-8">
          <div className="flex items-center gap-2">
            {isGemini ? (
              <Sparkles className="h-4 w-4 text-accent" />
            ) : (
              <Info className="h-4 w-4 text-ink-faint" />
            )}
            <span className="section-label">
              {isGemini ? 'AI reasoning' : 'Why this tool'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{result.explanation}</p>

          {/* Factors */}
          {result.factors && result.factors.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-surface-subtle px-3 py-2">
                  <span className="mt-0.5 text-xs font-semibold text-accent">{factor.label}</span>
                  <span className="text-xs text-ink-soft">{factor.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence — Facts vs AI reasoning */}
        <div className="p-6 sm:p-8">
          {/* Facts section */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-ink-faint" />
            <span className="section-label">Official sources</span>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Structured facts from the tool database — not generated by AI.
          </p>

          <div className="mt-3 space-y-2.5">
            {officialUrl && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-surface-hairline bg-surface-raised px-4 py-3 transition-all duration-200 hover:border-surface-border hover:bg-surface-subtle"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="h-4 w-4 text-ink-soft" />
                  <div>
                    <span className="block text-xs font-semibold text-ink-faint">Official website</span>
                    <span className="text-sm text-ink-soft">{result.tool.name}</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-ink-faint" />
              </a>
            )}

            {pricingUrl && (
              <a
                href={pricingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-surface-hairline bg-surface-raised px-4 py-3 transition-all duration-200 hover:border-surface-border hover:bg-surface-subtle"
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 text-success" />
                  <div>
                    <span className="block text-xs font-semibold text-ink-faint">Pricing source</span>
                    <span className="text-sm text-ink-soft">{result.estimatedCost}</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-ink-faint" />
              </a>
            )}

            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-surface-hairline bg-surface-raised px-4 py-3 transition-all duration-200 hover:border-surface-border hover:bg-surface-subtle"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-ink-soft" />
                <div>
                  <span className="block text-xs font-semibold text-ink-faint">Privacy source</span>
                  <span className="text-sm text-ink-soft">{privacyLabel[result.dataExposure]}</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-ink-faint" />
            </a>
          </div>

          {/* AI reasoning note */}
          <div className="mt-4 rounded-xl bg-surface-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              {isGemini ? (
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Info className="h-3.5 w-3.5 text-ink-faint" />
              )}
              <span className="text-xs font-semibold text-ink-faint">
                {isGemini ? 'AI reasoning' : 'Local analysis'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              {isGemini
                ? 'The recommendation above was generated by Gemini reasoning over the structured tool data. Pricing and privacy facts come from official sources, not the AI model.'
                : 'The recommendation was generated by our built-in ranking algorithm. Pricing and privacy facts come from official sources.'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center animate-fade-up" style={{ animationDelay: '120ms' }}>
        <button
          onClick={() => navigate('comparison')}
          className="btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to comparison
        </button>
        <button
          onClick={handleSave}
          disabled={alreadySaved || saveStatus === 'saving' || saveStatus === 'saved'}
          className="btn-secondary"
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : alreadySaved || saveStatus === 'saved' ? (
            <>
              <Check className="h-4 w-4 text-success" />
              Decision saved
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4" />
              Save Decision
            </>
          )}
        </button>
        {briefingStatus === 'playing' ? (
          <button
            onClick={handleStopBriefing}
            className="btn-primary"
          >
            <Pause className="h-4 w-4" />
            Stop Briefing
          </button>
        ) : (
          <button
            onClick={handleBriefing}
            disabled={briefingStatus === 'generating' || briefingStatus === 'unavailable'}
            className="btn-primary"
          >
            {briefingStatus === 'generating' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : briefingStatus === 'unavailable' ? (
              <>
                <Volume2 className="h-4 w-4" />
                Briefing unavailable
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Hear Briefing
              </>
            )}
          </button>
        )}
      </div>

      {/* Briefing error */}
      {briefingStatus === 'error' && briefingError && (
        <p className="mt-3 text-center text-xs text-error">
          {briefingError}. You can still read the full decision above.
        </p>
      )}

      {briefingStatus === 'unavailable' && (
        <p className="mt-3 text-center text-xs text-ink-faint">
          Voice briefing requires an ElevenLabs API key. The rest of the app works normally.
        </p>
      )}

      {briefingStatus === 'playing' && (
        <p className="mt-3 text-center text-xs text-ink-faint flex items-center justify-center gap-1">
          <Play className="h-3 w-3" />
          Briefing playing...
        </p>
      )}
    </div>
  );
}
