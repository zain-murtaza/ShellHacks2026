import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { DecisionConfig, DecisionResult, Screen, SensitiveItem, AnalysisState, AITool } from '@/types';
import { filterEligibleTools } from '@/logic/decision';
import { aiTools as localTools } from '@/data/aiTools';
import { getGeminiDecision, getLocalDecision } from '@/lib/geminiService';
import { fetchTools } from '@/lib/toolData';
import { getSupabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';

interface AppState {
  screen: Screen;
  config: DecisionConfig;
  result: DecisionResult | null;
  redactedText: string | null;
  detectedItems: SensitiveItem[];
  savedDecisions: DecisionResult[];
  tools: AITool[];
  toolsLoaded: boolean;
  analysis: AnalysisState;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  navigate: (screen: Screen) => void;
  updateConfig: (partial: Partial<DecisionConfig>) => void;
  computeResult: () => Promise<void>;
  setRedaction: (redacted: string, items: SensitiveItem[]) => void;
  saveDecision: (result: DecisionResult) => Promise<void>;
  reset: () => void;
}

const defaultConfig: DecisionConfig = {
  task: null,
  budget: null,
  sensitivity: null,
  priority: null,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [config, setConfig] = useState<DecisionConfig>(defaultConfig);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [redactedText, setRedactedText] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<SensitiveItem[]>([]);
  const [savedDecisions, setSavedDecisions] = useState<DecisionResult[]>([]);
  const [tools, setTools] = useState<AITool[]>(localTools);
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'idle', error: null });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load tools from Supabase on mount
  useEffect(() => {
    fetchTools().then(({ tools: fetched }) => {
      setTools(fetched);
      setToolsLoaded(true);
    });
  }, []);

  const navigate = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const updateConfig = useCallback((partial: Partial<DecisionConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const computeResult = useCallback(async () => {
    if (!config.task || !config.priority) return;

    setAnalysis({ status: 'loading', error: null });

    const eligible = filterEligibleTools(config);
    const candidates = eligible.length > 0 ? eligible : tools;

    // Try Gemini first
    const geminiResult = await getGeminiDecision(config, candidates);

    if ('result' in geminiResult) {
      setResult(geminiResult.result);
      setAnalysis({ status: 'success', error: null });
      navigate('result');
      return;
    }

    // Fall back to local deterministic recommendation
    const local = getLocalDecision(config);
    if (local) {
      setResult(local);
      setAnalysis({ status: 'fallback', error: geminiResult.error });
      navigate('result');
      return;
    }

    setAnalysis({ status: 'error', error: 'Unable to compute a recommendation' });
  }, [config, tools, navigate]);

  const setRedaction = useCallback((redacted: string, items: SensitiveItem[]) => {
    setRedactedText(redacted);
    setDetectedItems(items);
  }, []);

  const saveDecision = useCallback(async (r: DecisionResult) => {
    setSaveStatus('saving');

    const supabase = getSupabase();
    if (!supabase) {
      setSavedDecisions((prev) => [...prev, r]);
      setSaveStatus('saved');
      return;
    }

    try {
      const sessionId = getSessionId();
      const { error } = await supabase.from('saved_decisions').insert({
        session_id: sessionId,
        task: config.task,
        budget: config.budget,
        data_sensitivity: config.sensitivity,
        priority: config.priority,
        recommended_tool: r.tool.id,
        estimated_cost: r.estimatedCost,
        exposure_level: r.dataExposure,
        reasoning: r.explanation,
        workflow: r.workflow,
        confidence: r.confidence ?? null,
        factors: r.factors ?? null,
      });

      if (error) throw error;

      setSavedDecisions((prev) => [...prev, r]);
      setSaveStatus('saved');
    } catch {
      // Fallback: keep in local state
      setSavedDecisions((prev) => [...prev, r]);
      setSaveStatus('saved');
    }
  }, [config]);

  const reset = useCallback(() => {
    setConfig(defaultConfig);
    setResult(null);
    setRedactedText(null);
    setDetectedItems([]);
    setAnalysis({ status: 'idle', error: null });
    setSaveStatus('idle');
    navigate('landing');
  }, [navigate]);

  return (
    <AppContext.Provider
      value={{
        screen,
        config,
        result,
        redactedText,
        detectedItems,
        savedDecisions,
        tools,
        toolsLoaded,
        analysis,
        saveStatus,
        navigate,
        updateConfig,
        computeResult,
        setRedaction,
        saveDecision,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
