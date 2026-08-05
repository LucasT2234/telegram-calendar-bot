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
}).registerSingleton();

bot.onDirectMessage(async (thread, message) => {
  if (message.text?.trim() === "/start") {
    await thread.post(
      `Hi! I'm your calendar assistant. Chat ID: ${thread.id}\n\n` +
        "Set that as TELEGRAM_CHAT_ID if you want me to send reminders. " +
        "Just tell me things like \"lunch with Sam tomorrow 1pm\" or \"what's on my calendar this week?\".",
    );
    return;
  }

  await thread.startTyping();

  const { messages: recent } = await thread.adapter.fetchMessages(thread.id, {
    limit: 20,
  });
  const history = await toAiMessages(recent);

  try {
    const agent = createCalendarAgent();
    const result = await agent.generate({ messages: history });
    await thread.post(result.text || "Done.");
  } catch (error) {
    console.error("Agent error:", error);
    await thread.post(
      "Something went wrong handling that — mind trying again?",
    );
  }
});
