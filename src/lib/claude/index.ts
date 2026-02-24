// Claude API wrapper + token tracking + cache

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getClaudeClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return client;
}

export async function analyzeBrandDNA(userInput: unknown, crawlData: unknown) {
  // TODO: Analyze brand DNA using Claude Sonnet
  throw new Error('Not implemented');
}

export async function generateContent(
  brandDNA: unknown,
  channel: string,
  contentType: string,
  options?: unknown
) {
  // TODO: 2-Phase generation (Haiku draft → Sonnet refinement)
  throw new Error('Not implemented');
}
