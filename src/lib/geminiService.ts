import type { AITool, DecisionConfig, DecisionResult, PrivacyCategory, FitScore } from '@/types';
import { buildDecisionResult as localDecision } from '@/logic/decision';
import { fetchToolUrls } from '@/lib/toolData';

interface GeminiResponse {
  recommendedTool: string;
  taskFit: number;
  costFit: number;
  exposureLevel: string;
  reasoning: string;
  workflow: string;
  confidence: number;
  factors: { label: string; detail: string }[];
}

interface CandidateToolPayload {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing_label: string;
  privacy_label: string;
  privacy_notes: string;
  strongest_use_case: string;
  task_fit_scores: Record<string, number>;
}

function toPayload(tool: AITool): CandidateToolPayload {
  const scores: Record<string, number> = {};
  for (const [key, val] of Object.entries(tool.taskFit)) {
    scores[key] = val;
  }
  return {
    id: tool.id,
    name: tool.name,
    description: tool.tagline,
    category: tool.costCategory,
    pricing_label: tool.priceNote,
    privacy_label: tool.privacyCategory,
    privacy_notes: tool.privacyNote,
    strongest_use_case: tool.strongestUseCase,
    task_fit_scores: scores,
  };
}

function getEdgeFunctionUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return null;
  return `${url}/functions/v1/gemini-decision`;
}

export async function getGeminiDecision(
  config: DecisionConfig,
  candidates: AITool[]
): Promise<{ result: DecisionResult; source: 'gemini' } | { error: string }> {
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
      body: JSON.stringify({
        task: config.task,
        budget: config.budget,
        dataSensitivity: config.sensitivity,
        priority: config.priority,
        candidateTools: candidates.map(toPayload),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { error: body.error ?? `Request failed (${response.status})` };
    }

    const data = (await response.json()) as GeminiResponse;

    const tool = candidates.find((t) => t.id === data.recommendedTool);
    if (!tool) {
      return { error: 'Recommended tool not found in candidates' };
    }

    const urls = await fetchToolUrls(tool.id);
    const sourceUrl = urls?.privacyUrl ?? urls?.officialUrl ?? tool.sourceUrl;

    const result: DecisionResult = {
      tool,
      workflow: data.workflow,
      estimatedCost: tool.priceNote,
      dataExposure: (data.exposureLevel as PrivacyCategory) ?? tool.privacyCategory,
      taskFit: (data.taskFit as FitScore) ?? tool.taskFit[config.task!],
      explanation: data.reasoning,
      evidence: tool.evidenceNote,
      sourceUrl,
      source: 'gemini',
      confidence: data.confidence,
      factors: data.factors,
      costFit: data.costFit,
    };

    return { result, source: 'gemini' };
  } catch {
    return { error: 'Network error contacting decision engine' };
  }
}

export function getLocalDecision(config: DecisionConfig): DecisionResult | null {
  const result = localDecision(config);
  if (result) {
    return { ...result, source: 'local' as const };
  }
  return null;
}
