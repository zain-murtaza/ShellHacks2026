export type TaskCategory = 'research' | 'writing' | 'coding' | 'images' | 'study' | 'meetings';

export type BudgetTier = 'free' | 'under10' | 'under25' | 'under50';

export type SensitivityLevel = 'low' | 'medium' | 'high';

export type Priority = 'capability' | 'privacy' | 'cost' | 'balanced';

export type Screen = 'landing' | 'setup' | 'comparison' | 'privacy' | 'result';

export type FitScore = 1 | 2 | 3 | 4 | 5;

export type CostCategory = 'free' | 'freemium' | 'paid' | 'enterprise';

export type PrivacyCategory = 'minimal' | 'moderate' | 'elevated';

export interface DecisionConfig {
  task: TaskCategory | null;
  budget: BudgetTier | null;
  sensitivity: SensitivityLevel | null;
  priority: Priority | null;
}

export interface AITool {
  id: string;
  name: string;
  vendor: string;
  tagline: string;
  taskFit: Record<TaskCategory, FitScore>;
  costCategory: CostCategory;
  priceNote: string;
  privacyCategory: PrivacyCategory;
  privacyNote: string;
  strongestUseCase: string;
  explanation: string;
  evidenceNote: string;
  sourceUrl: string;
  officialUrl?: string;
  pricingUrl?: string;
  privacyUrl?: string;
}

export interface SensitiveItem {
  id: string;
  type: 'email' | 'phone' | 'id' | 'name';
  label: string;
  value: string;
  start: number;
  end: number;
}

export interface DecisionFactor {
  label: string;
  detail: string;
}

export type DecisionSource = 'gemini' | 'local';

export interface DecisionResult {
  tool: AITool;
  workflow: string;
  estimatedCost: string;
  dataExposure: PrivacyCategory;
  taskFit: FitScore;
  explanation: string;
  evidence: string;
  sourceUrl: string;
  source: DecisionSource;
  confidence?: number;
  factors?: DecisionFactor[];
  costFit?: number;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error' | 'fallback';

export interface AnalysisState {
  status: AnalysisStatus;
  error: string | null;
}

export type BriefingStatus = 'idle' | 'generating' | 'playing' | 'error' | 'unavailable' | 'device-voice';
