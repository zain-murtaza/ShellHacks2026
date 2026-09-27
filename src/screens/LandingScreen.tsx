import { ArrowRight, ShieldCheck, Zap, DollarSign, ScanLine } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function LandingScreen() {
  const { navigate } = useApp();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-accent-soft/60 via-surface-subtle/40 to-transparent blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-20 pt-24 text-center sm:px-8 sm:pt-32">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-hairline bg-surface/60 px-3 py-1 text-xs font-medium text-ink-muted backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            ShellHacks 2026
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tightest text-ink sm:text-6xl">
            Your AI. Your Data. Your Decision.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-ink-muted sm:text-xl">
            Compare AI tools by task fit, privacy exposure and cost before you commit.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('setup')}
              className="btn-primary group px-7 py-3.5 text-[15px]"
            >
              Start a Decision
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('comparison')}
              className="btn-ghost px-5 py-3.5 text-[15px]"
            >
              Browse AI Tools
            </button>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: 'Task Fit', desc: 'See which tools actually excel at your specific task.' },
            { icon: ShieldCheck, title: 'Privacy', desc: 'Understand data exposure before you paste anything in.' },
            { icon: DollarSign, title: 'Cost', desc: 'Filter by your budget — from free to enterprise.' },
            { icon: ScanLine, title: 'Redaction', desc: 'Strip sensitive data locally before using any AI tool.' },
          ].map((item, i) => (
            <div
              key={item.title}
              className="card card-hover animate-fade-up p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-subtle">
                <item.icon className="h-5 w-5 text-accent" strokeWidth={2} />
              </div>
              <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="card overflow-hidden">
          <div className="border-b border-surface-hairline px-6 py-5 sm:px-8">
            <h2 className="text-lg font-semibold text-ink">How it works</h2>
            <p className="mt-1 text-sm text-ink-muted">Four steps to a confident choice.</p>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', title: 'Set your context', desc: 'Pick a task, budget, sensitivity, and priority.' },
              { n: '02', title: 'Compare tools', desc: 'See side-by-side cards for each AI tool.' },
              { n: '03', title: 'Check privacy', desc: 'Redact sensitive data before you send it anywhere.' },
              { n: '04', title: 'Get a decision', desc: 'A clear recommendation with reasoning and sources.' },
            ].map((step, i) => (
              <div
                key={step.n}
                className={`p-6 sm:p-8 ${
                  i < 3 ? 'border-b border-surface-hairline sm:border-b-0 sm:border-r' : ''
                }`}
              >
                <span className="text-xs font-semibold tracking-widest text-accent">{step.n}</span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
