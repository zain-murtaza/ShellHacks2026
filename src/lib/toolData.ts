import { getSupabase } from '@/lib/supabase';
import { aiTools as localTools } from '@/data/aiTools';
import type { AITool, CostCategory, FitScore, PrivacyCategory, TaskCategory } from '@/types';

interface DbTool {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing_label: string;
  pricing_value: number;
  privacy_label: string;
  privacy_notes: string;
  strongest_use_case: string;
  supported_tasks: string[];
  task_fit_scores: Record<string, number>;
  official_url: string | null;
  privacy_url: string | null;
  pricing_url: string | null;
}

function mapDbTool(db: DbTool): AITool {
  const taskFit = {} as Record<TaskCategory, FitScore>;
  const allTasks: TaskCategory[] = ['research', 'writing', 'coding', 'images', 'study', 'meetings'];
  for (const t of allTasks) {
    taskFit[t] = (db.task_fit_scores[t] ?? 1) as FitScore;
  }

  return {
    id: db.id,
    name: db.name,
    vendor: '',
    tagline: db.description,
    taskFit,
    costCategory: db.category as CostCategory,
    priceNote: db.pricing_label,
    privacyCategory: db.privacy_label as PrivacyCategory,
    privacyNote: db.privacy_notes,
    strongestUseCase: db.strongest_use_case,
    explanation: db.description,
    evidenceNote: 'Based on official privacy policy and published pricing',
    sourceUrl: db.privacy_url ?? db.official_url ?? '#',
    officialUrl: db.official_url ?? undefined,
    pricingUrl: db.pricing_url ?? undefined,
    privacyUrl: db.privacy_url ?? undefined,
  };
}

export async function fetchTools(): Promise<{ tools: AITool[]; fromDb: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { tools: localTools, fromDb: false };
  }

  try {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      return { tools: localTools, fromDb: false };
    }

    return { tools: data.map(mapDbTool), fromDb: true };
  } catch {
    return { tools: localTools, fromDb: false };
  }
}

export interface ToolSourceUrls {
  officialUrl: string | null;
  privacyUrl: string | null;
  pricingUrl: string | null;
}

export async function fetchToolUrls(toolId: string): Promise<ToolSourceUrls | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('official_url, privacy_url, pricing_url')
      .eq('id', toolId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      officialUrl: data.official_url,
      privacyUrl: data.privacy_url,
      pricingUrl: data.pricing_url,
    };
  } catch {
    return null;
  }
}
