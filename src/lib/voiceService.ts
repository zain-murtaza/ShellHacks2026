import type { DecisionConfig, DecisionResult } from '@/types';
import { taskLabels } from '@/data/aiTools';

function getEdgeFunctionUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return null;
  return `${url}/functions/v1/voice-briefing`;
}

export function buildBriefingText(
  result: DecisionResult,
  config: DecisionConfig
): string {
  const task = config.task ? taskLabels[config.task] : 'your task';
  const budget = config.budget
    ? config.budget === 'free'
      ? 'a free'
      : `an under-$${config.budget.replace('under', '')}`
    : 'a';
  const sensitivity = config.sensitivity ?? 'medium';
  const tool = result.tool.name;
  const cost = result.estimatedCost;
  const reason = result.explanation.split('.')[0] + '.';

  return `You selected ${task} with ${budget} budget and ${sensitivity} data sensitivity. Your current recommendation is ${tool}. It fits because ${reason} Your estimated cost is ${cost}. Before sharing sensitive information, use the Privacy Gate to redact personal data.`;
}

export async function generateBriefing(
  text: string
): Promise<{ audioUrl: string } | { error: string }> {
  const functionUrl = getEdgeFunctionUrl();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!functionUrl || !anonKey) {
    return { error: 'Supabase not configured' };
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { error: body.error ?? `Request failed (${response.status})` };
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    return { audioUrl };
  } catch {
    return { error: 'Network error contacting voice service' };
  }
}
