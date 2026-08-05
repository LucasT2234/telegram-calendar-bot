import { bot } from "@/lib/bot";

// Backstop above the agent's own 25s timeout so a genuinely wedged request
// (e.g. hanging before the agent call even starts) can't hold the per-thread
// lock for the platform's full 300s default.
export const maxDuration = 60;

export async function POST(request: Request) {
  return bot.webhooks.telegram(request);
}
