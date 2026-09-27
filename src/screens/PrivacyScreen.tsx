import { useState, useMemo, useCallback } from 'react';
import { ShieldAlert, Wand2, Copy, Check, ArrowRight, Mail, Phone, IdCard, User, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { detectSensitive, redactText, highlightText } from '@/logic/redaction';
import type { SensitiveItem } from '@/types';

const sampleText = `Hi, I'm Jessica Smith and I need help summarising my research notes.

You can reach me at jessica.smith@gmail.com or (555) 123-4567.

My student ID is STU-482910 and I'm working on a literature review about climate policy.

Please draft an outline based on the attached document — ID-7738201.`;

const typeMeta: Record<SensitiveItem['type'], { icon: typeof Mail; color: string; label: string }> = {
  email: { icon: Mail, color: 'text-accent', label: 'Email' },
  phone: { icon: Phone, color: 'text-warning', label: 'Phone' },
  id: { icon: IdCard, color: 'text-error', label: 'ID' },
  name: { icon: User, color: 'text-success', label: 'Name' },
};

export function PrivacyScreen() {
  const { navigate, setRedaction } = useApp();
  const [text, setText] = useState('');
  const [redacted, setRedacted] = useState('');
  const [hasRedacted, setHasRedacted] = useState(false);
  const [copied, setCopied] = useState(false);

  const detected = useMemo(() => (text ? detectSensitive(text) : []), [text]);

  const { segments } = useMemo(
    () => highlightText(text, detected),
    [text, detected]
  );

  const handleRedact = useCallback(() => {
    const { redacted: result } = redactText(text, detected);
    setRedacted(result);
    setHasRedacted(true);
    setRedaction(result, detected);
  }, [text, detected, setRedaction]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(redacted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [redacted]);

  const handleSample = useCallback(() => {
    setText(sampleText);
    setHasRedacted(false);
    setRedacted('');
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="animate-fade-up">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft">
            <ShieldAlert className="h-5 w-5 text-warning" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Privacy Gate
          </h1>
        </div>
        <p className="mt-2 text-ink-muted">
          Paste text and we'll detect sensitive patterns locally in your browser — nothing is uploaded.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-faint">
          <Lock className="h-3 w-3" />
          Processed locally in your browser
        </div>
      </div>

      {/* Warning banner */}
      {detected.length > 0 && !hasRedacted && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 animate-scale-in">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-ink">Before you send this to an AI tool...</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              We found {detected.length} sensitive item{detected.length !== 1 ? 's' : ''}. Consider redacting them first.
            </p>
          </div>
        </div>
      )}

      {/* Detected items */}
      {detected.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '60ms' }}>
          {detected.map((item) => {
            const meta = typeMeta[item.type];
            return (
              <div
                key={item.id}
                className="chip border border-surface-hairline bg-surface"
              >
                <meta.icon className={`h-3 w-3 ${meta.color}`} />
                <span className="text-ink-soft">{meta.label}</span>
                <span className="text-ink-faint">·</span>
                <span className="font-mono text-ink-soft">{item.value.length > 24 ? item.value.slice(0, 24) + '…' : item.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Input + Output side by side */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="section-label">Your text</span>
            <button
              onClick={handleSample}
              className="text-xs font-medium text-accent transition-opacity hover:opacity-70"
            >
              Use sample
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setHasRedacted(false);
              setRedacted('');
            }}
            placeholder="Paste the text you plan to send to an AI tool..."
            className="h-72 w-full resize-none rounded-2xl border border-surface-border bg-surface p-4 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:shadow-focus scrollbar-thin"
          />
          {text && (
            <div className="mt-3 rounded-2xl border border-surface-hairline bg-surface-raised p-4">
              <span className="section-label">Highlighted preview</span>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {segments.map((seg, i) =>
                  seg.type === 'plain' ? (
                    <span key={i}>{seg.text}</span>
                  ) : (
                    <mark
                      key={i}
                      className={`rounded px-0.5 ${
                        seg.type === 'email'
                          ? 'bg-accent-soft text-accent'
                          : seg.type === 'phone'
                          ? 'bg-warning-soft text-warning'
                          : seg.type === 'id'
                          ? 'bg-error-soft text-error'
                          : 'bg-success-soft text-success'
                      }`}
                    >
                      {seg.text}
                    </mark>
                  )
                )}
              </p>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="mb-2 flex items-center justify-between">
            <span className="section-label">Redacted version</span>
            {hasRedacted && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-70"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="h-72 w-full overflow-auto rounded-2xl border border-surface-border bg-surface-raised p-4 text-sm text-ink-soft scrollbar-thin">
            {hasRedacted ? (
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">{redacted}</pre>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-ink-faint">
                <div>
                  <Wand2 className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">
                    Click "Redact Automatically" to see the cleaned version here.
                  </p>
                </div>
              </div>
            )}
          </div>
          {hasRedacted && (
            <p className="mt-3 text-xs text-success">
              {detected.length} item{detected.length !== 1 ? 's' : ''} redacted. Safe to copy into your AI tool.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={handleRedact}
          disabled={!text || detected.length === 0}
          className="btn-primary group"
        >
          <Wand2 className="h-4 w-4" />
          Redact Automatically
        </button>
        <button
          onClick={() => navigate('result')}
          className="btn-secondary group"
        >
          Continue to Result
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
