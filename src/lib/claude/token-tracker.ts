// Token usage tracking utility
// MVP: console logging only. Future: persist to api_usage_logs via Supabase.

export interface TokenUsage {
  model: string;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

// Approximate pricing per 1M tokens (USD) as of mid-2025
const PRICING: Record<string, { input: number; output: number }> = {
  // Claude Sonnet 4.5
  'claude-sonnet-4-5-20250514': { input: 3.0, output: 15.0 },
  // Claude Haiku 4.5
  'claude-haiku-4-5-20241022': { input: 0.8, output: 4.0 },
};

// Fallback pricing for unknown model variants (conservative Sonnet rate)
const DEFAULT_PRICING = { input: 3.0, output: 15.0 };

export function calculateCost(
  model: string,
  tokensIn: number,
  tokensOut: number
): number {
  // Find pricing by exact key first, then by prefix match for future model versions
  let pricing = PRICING[model];

  if (!pricing) {
    const matchingKey = Object.keys(PRICING).find((key) =>
      model.toLowerCase().startsWith(key.toLowerCase().split('-').slice(0, 3).join('-'))
    );
    pricing = matchingKey ? PRICING[matchingKey] : DEFAULT_PRICING;
  }

  const inputCost = (tokensIn / 1_000_000) * pricing.input;
  const outputCost = (tokensOut / 1_000_000) * pricing.output;

  // Round to 6 decimal places to avoid floating-point noise
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export async function trackTokenUsage(
  userId: string,
  projectId: string,
  usage: TokenUsage
): Promise<void> {
  // MVP: structured console log for observability
  // TODO: Replace with Supabase insert into api_usage_logs
  console.log('[Token Usage]', {
    userId,
    projectId,
    model: usage.model,
    tokensIn: usage.tokensIn,
    tokensOut: usage.tokensOut,
    cost: usage.cost,
    timestamp: new Date().toISOString(),
  });
}
