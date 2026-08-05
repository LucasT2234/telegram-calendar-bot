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

bot.onDirectMessage(async (thread, message) => {
  await thread.startTyping();

  const { messages: recent } = await thread.adapter.fetchMessages(thread.id, {
    limit: 20,
  });
  const history = await toAiMessages(recent);

  try {
    const agent = createCalendarAgent();
    const result = await agent.generate({ messages: history, timeout: 25_000 });
    await thread.post(result.text || "Done.");
  } catch (error) {
    console.error("Agent error:", error);
    await thread.post(
      "Something went wrong handling that — mind trying again?",
    );
  }
});
