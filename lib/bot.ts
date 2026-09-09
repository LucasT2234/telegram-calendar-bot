import { Chat } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { toAiMessages } from "chat/ai";
import { createCalendarAgent } from "./agent";

export const bot = new Chat({
  userName: process.env.TELEGRAM_BOT_USERNAME || "calendarbot",
  adapters: {
    telegram: createTelegramAdapter(),
  },
  state: createMemoryState(),
  logger: "debug",
  // If a prior request on this thread hangs past its own timeout instead of
  // releasing the lock cleanly, don't let it block the thread forever.
  onLockConflict: "force",
}).registerSingleton();

bot.onSlashCommand("/start", async (event) => {
  await event.channel.post(
    `Hi! I'm your calendar assistant. Your Telegram user ID (for TELEGRAM_CHAT_ID) is: ${event.user.userId}\n\n` +
      "Just tell me things like \"lunch with Sam tomorrow 1pm\" or \"what's on my calendar this week?\".",
  );
});

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out: ${label}`)), ms),
    ),
  ]);
}

bot.onDirectMessage(async (thread, message) => {
  const handlerStart = Date.now();
  try {
    console.log("[handler] start", { text: message.text });

    // Independent Telegram API calls — run in parallel instead of back-to-back.
    const [, { messages: recent }] = await Promise.all([
      withTimeout(thread.startTyping(), 8_000, "startTyping"),
      withTimeout(
        thread.adapter.fetchMessages(thread.id, { limit: 10 }),
        8_000,
        "fetchMessages",
      ),
    ]);
    console.log("[handler] typing sent, fetched history", { count: recent.length });

    const history = await toAiMessages(recent);
    console.log("[handler] converted to ai messages", { count: history.length });

    const agent = createCalendarAgent();
    const agentStart = Date.now();
    // 65s here, not 90s (the route's maxDuration): needs enough margin below
    // the platform's hard cutoff for typing/fetchMessages overhead plus a
    // graceful catch — hitting maxDuration kills the function outright with
    // no chance to reply, instead of falling into the catch block below.
    const result = await agent.generate({ messages: history, timeout: 65_000 });
    console.log("[handler] agent done", {
      text: result.text,
      elapsedMs: Date.now() - agentStart,
    });

    await thread.post(result.text || "Done.");
    console.log("[handler] reply posted");
  } catch (error) {
    console.error("[handler] error:", error, {
      elapsedMs: Date.now() - handlerStart,
    });
    await thread.post(
      "Something went wrong handling that — mind trying again?",
    );
  }
});
