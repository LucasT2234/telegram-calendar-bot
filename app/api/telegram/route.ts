import { waitUntil } from "@vercel/functions";
import { bot } from "@/lib/bot";

// Backstop above the agent's own 25s timeout so a genuinely wedged request
// (e.g. hanging before the agent call even starts) can't hold the per-thread
// lock for the platform's full 300s default.
export const maxDuration = 60;

export async function POST(request: Request) {
  // The adapter acks Telegram immediately and processes the message in the
  // background; without waitUntil, Vercel freezes the function as soon as
  // this response is returned, silently killing that background work.
  return bot.webhooks.telegram(request, { waitUntil });
}
