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
  try {
    console.log("[handler] start", { text: message.text });

    await withTimeout(thread.startTyping(), 8_000, "startTyping");
    console.log("[handler] typing sent");

    const { messages: recent } = await withTimeout(
      thread.adapter.fetchMessages(thread.id, { limit: 20 }),
      8_000,
      "fetchMessages",
    );
    console.log("[handler] fetched history", { count: recent.length });

    const history = await toAiMessages(recent);
    console.log("[handler] converted to ai messages", { count: history.length });

    const agent = createCalendarAgent();
    const result = await agent.generate({ messages: history, timeout: 55_000 });
    console.log("[handler] agent done", { text: result.text });

    await thread.post(result.text || "Done.");
    console.log("[handler] reply posted");
  } catch (error) {
    console.error("[handler] error:", error);
    await thread.post(
      "Something went wrong handling that — mind trying again?",
    );
  }
});
