const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CandidateTool {
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

interface DecisionInput {
  task: string;
  budget: string;
  dataSensitivity: string;
  priority: string;
  candidateTools: CandidateTool[];
}

interface DecisionOutput {
  recommendedTool: string;
  taskFit: number;
  costFit: number;
  exposureLevel: string;
  reasoning: string;
  workflow: string;
  confidence: number;
  factors: { label: string; detail: string }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const input = await req.json() as DecisionInput;

    if (!input.candidateTools || input.candidateTools.length === 0) {
      return new Response(
        JSON.stringify({ error: "No candidate tools provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const toolsSummary = input.candidateTools.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      costCategory: t.category,
      pricing: t.pricing_label,
      privacyCategory: t.privacy_label,
      privacyNotes: t.privacy_notes,
      strongestUseCase: t.strongest_use_case,
      taskFitForSelectedTask: t.task_fit_scores[input.task] ?? 1,
    }));

    const prompt = `You are an AI tool recommendation engine. Based ONLY on the structured tool data provided below, recommend the best AI tool for the user's needs. Do NOT invent pricing, privacy claims, or capabilities not present in the data. Do NOT browse the internet. Your role is reasoning and ranking over the supplied evidence.

User preferences:
- Task: ${input.task}
- Budget: ${input.budget}
- Data sensitivity: ${input.dataSensitivity}
- Priority: ${input.priority}

Candidate tools (already filtered for budget and sensitivity compatibility):
${JSON.stringify(toolsSummary, null, 2)}

Respond with ONLY a JSON object (no markdown, no explanation outside JSON) with this exact structure:
{
  "recommendedTool": "<tool id from the candidates>",
  "taskFit": <1-5 integer>,
  "costFit": <1-5 integer>,
  "exposureLevel": "<minimal | moderate | elevated>",
  "reasoning": "<2-3 sentence explanation of why this tool, referencing the user's priority and task>",
  "workflow": "<1-2 sentence practical workflow recommendation>",
  "confidence": <0-1 decimal>,
  "factors": [{"label": "<short label>", "detail": "<brief detail>"}]
}

The reasoning must be grounded in the supplied tool data only. Keep it concise.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Gemini analysis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: "Empty response from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: DecisionOutput;
    try {
      parsed = JSON.parse(textContent) as DecisionOutput;
    } catch {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "Malformed Gemini response" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      parsed = JSON.parse(jsonMatch[0]) as DecisionOutput;
    }

    const validToolIds = input.candidateTools.map((t) => t.id);
    if (!validToolIds.includes(parsed.recommendedTool)) {
      return new Response(
        JSON.stringify({ error: "Gemini recommended an unknown tool" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
