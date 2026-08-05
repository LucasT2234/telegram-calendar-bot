import { bot } from "@/lib/bot";
import { listEvents } from "@/lib/calendar";
import { tomorrowRangeUtc, formatTimeInZone } from "@/lib/timezone";

const TIMEZONE = process.env.TIMEZONE || "UTC";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    return Response.json({ skipped: "TELEGRAM_CHAT_ID not set" });
  }

  const { startISO, endISO } = tomorrowRangeUtc(TIMEZONE);
  const events = await listEvents({ timeMinISO: startISO, timeMaxISO: endISO });

  const threadId = await bot.getAdapter("telegram").openDM(chatId);
  const thread = bot.thread(threadId);

  if (events.length === 0) {
    await thread.post("Nothing on your calendar tomorrow.");
  } else {
    const lines = events.map((event) => {
      const time = event.start ? formatTimeInZone(event.start, TIMEZONE) : "?";
      return `${time} — ${event.summary}${event.location ? ` (${event.location})` : ""}`;
    });
    await thread.post(`Tomorrow's schedule:\n${lines.join("\n")}`);
  }

  return Response.json({ eventsSent: events.length });
}
