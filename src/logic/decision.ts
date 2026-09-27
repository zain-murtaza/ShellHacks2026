import type {
  AITool,
  BudgetTier,
  DecisionConfig,
  DecisionResult,
  FitScore,
  Priority,
  PrivacyCategory,
  SensitivityLevel,
  TaskCategory,
} from '@/types';
import { aiTools } from '@/data/aiTools';

const budgetMaxMonthly: Record<BudgetTier, number> = {
  free: 0,
  under10: 10,
  under25: 25,
  under50: 50,
};

const costCategoryToMax: Record<string, number> = {
  free: 0,
  freemium: 20,
  paid: 25,
  enterprise: 50,
};

const sensitivityToMaxPrivacy: Record<SensitivityLevel, PrivacyCategory> = {
  low: 'elevated',
  medium: 'moderate',
  high: 'minimal',
};

function privacyRank(p: PrivacyCategory): number {
  return p === 'minimal' ? 3 : p === 'moderate' ? 2 : 1;
}

function fitRank(score: FitScore): number {
  return score;
}

function meetsBudget(tool: AITool, budget: BudgetTier): boolean {
  return costCategoryToMax[tool.costCategory] <= budgetMaxMonthly[budget];
}

function meetsSensitivity(tool: AITool, sensitivity: SensitivityLevel): boolean {
  const maxPrivacy = sensitivityToMaxPrivacy[sensitivity];
  return privacyRank(tool.privacyCategory) >= privacyRank(maxPrivacy);
}

export function scoreTool(
  tool: AITool,
  config: DecisionConfig
): number {
  if (!config.task || !config.priority) return 0;

  const fit = tool.taskFit[config.task];
  const privacy = privacyRank(tool.privacyCategory);

  const weights: Record<Priority, { fit: number; privacy: number; cost: number }> = {
    capability: { fit: 0.6, privacy: 0.15, cost: 0.25 },
    privacy: { fit: 0.25, privacy: 0.6, cost: 0.15 },
    cost: { fit: 0.25, privacy: 0.15, cost: 0.6 },
    balanced: { fit: 0.4, privacy: 0.3, cost: 0.3 },
  };

  const w = weights[config.priority];

  const costScore =
    tool.costCategory === 'free'
      ? 5
      : tool.costCategory === 'freemium'
      ? 4
      : tool.costCategory === 'paid'
      ? 2
      : 1;

  return (
    (fit / 5) * w.fit * 100 +
    (privacy / 3) * w.privacy * 100 +
    (costScore / 5) * w.cost * 100
  );
}

export function rankTools(config: DecisionConfig): AITool[] {
  return [...aiTools]
    .map((tool) => ({ tool, score: scoreTool(tool, config) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.tool);
}

export function filterEligibleTools(config: DecisionConfig): AITool[] {
  return aiTools.filter((tool) => {
    if (config.budget && !meetsBudget(tool, config.budget)) return false;
    if (config.sensitivity && !meetsSensitivity(tool, config.sensitivity))
      return false;
    return true;
  });
}

export function buildDecisionResult(config: DecisionConfig): DecisionResult | null {
  if (!config.task || !config.priority) return null;

  const eligible = filterEligibleTools(config);
  const pool = eligible.length > 0 ? eligible : aiTools;

  const ranked = pool
    .map((tool) => ({ tool, score: scoreTool(tool, config) }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;

  const tool = ranked[0].tool;
  const fit = tool.taskFit[config.task];

  const workflow = buildWorkflow(tool, config);
  const estimatedCost = tool.priceNote;
  const dataExposure = tool.privacyCategory;

  return {
    tool,
    workflow,
    estimatedCost,
    dataExposure,
    taskFit: fit,
    explanation: tool.explanation,
    evidence: tool.evidenceNote,
    sourceUrl: tool.sourceUrl,
    source: 'local' as const,
  };
}

function buildWorkflow(tool: AITool, config: DecisionConfig): string {
  const task = config.task as TaskCategory;
  const taskPhrase: Record<TaskCategory, string> = {
    research: 'research and source-gathering',
    writing: 'drafting and refining writing',
    coding: 'writing and debugging code',
    images: 'creating and editing images',
    study: 'studying and review',
    meetings: 'capturing and summarising meetings',
  };

  let steps = `Use ${tool.name} for ${taskPhrase[task]}.`;

  if (config.sensitivity === 'high') {
    steps += ' Run sensitive content through the Privacy Gate before pasting it in.';
  } else if (config.sensitivity === 'medium') {
    steps += ' Consider redacting personal details before sharing.';
  }

  if (config.priority === 'cost') {
    steps += ' Stick to the free tier to stay within budget.';
  }

  return steps;
}

export function fitLabel(score: FitScore): string {
  return ['', 'Weak', 'Limited', 'Decent', 'Strong', 'Excellent'][score];
}
