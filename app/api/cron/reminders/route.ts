import { bot } from "@/lib/bot";
import { listEvents } from "@/lib/calendar";

// Matches the cron schedule in vercel.json (every 10 min) so each event
// falls into exactly one run's window instead of firing multiple reminders.
const LOOKAHEAD_MINUTES = 10;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    return Response.json({ skipped: "TELEGRAM_CHAT_ID not set" });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60_000);

  const events = await listEvents({
    timeMinISO: now.toISOString(),
    timeMaxISO: soon.toISOString(),
  });

  const threadId = await bot.getAdapter("telegram").openDM(chatId);
  const thread = bot.thread(threadId);
  for (const event of events) {
    await thread.post(
      `Reminder: "${event.summary}" starts at ${event.start}${
        event.location ? ` (${event.location})` : ""
      }`,
    );
  }

  return Response.json({ remindersSent: events.length });
}
