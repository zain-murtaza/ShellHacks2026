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

export type BriefingResult =
  | { audioUrl: string; source: 'elevenlabs' }
  | { source: 'device' }
  | { error: string };

export async function generateBriefing(
  text: string
): Promise<BriefingResult> {
  const functionUrl = getEdgeFunctionUrl();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!functionUrl || !anonKey) {
    return { error: 'Voice briefing not configured' };
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
      return { source: 'device' };
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    return { audioUrl, source: 'elevenlabs' };
  } catch {
    return { source: 'device' };
  }
}

export function speakWithDeviceVoice(text: string): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopDeviceVoice(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
