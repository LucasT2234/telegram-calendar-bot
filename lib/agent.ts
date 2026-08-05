import { ToolLoopAgent, isStepCount } from "ai";
import { google } from "@ai-sdk/google";
import {
  createEventTool,
  listEventsTool,
  deleteEventTool,
  updateEventTool,
  findConflictsTool,
} from "./tools/calendar-tools";

const TIMEZONE = process.env.TIMEZONE || "UTC";
// Gemini has a genuinely free tier (Google AI Studio key), unlike Anthropic's
// API — using it directly here avoids any per-message cost.
const MODEL = google(process.env.AGENT_MODEL || "gemini-3.5-flash");

function buildInstructions(): string {
  const now = new Date();
  return `You are a personal calendar assistant chatting with your owner over Telegram. You manage their Google Calendar on their behalf.

Current date/time: ${now.toISOString()}. The owner's timezone is ${TIMEZONE} — always resolve relative dates ("tomorrow", "next Tuesday", "in 2 hours") against this current time and that timezone, and pass startISO/endISO to tools as full ISO 8601 timestamps with a timezone offset matching ${TIMEZONE} (not "Z" unless that timezone is actually UTC).

Behavior:
- Before creating an event, call findConflicts for that time range. If something overlaps, tell the user what conflicts and ask how to proceed rather than silently double-booking — unless the user has already said to book it anyway.
- Before deleting or rescheduling, make sure you have the right event. If the user's request is ambiguous, call listEvents to find candidates and confirm which one before acting; if there's a single clear match, just proceed.
- Default event duration is 1 hour if the user doesn't give an end time.
- Keep replies short and conversational, like a text message. Confirm what you did in plain language (e.g. "Booked lunch with Sam tomorrow, 1-2pm."). Don't dump raw JSON, IDs, or links unless the user asks for them.
- If a request isn't calendar-related, say briefly that it's outside what you can help with.`;
}

export function createCalendarAgent() {
  return new ToolLoopAgent({
    model: MODEL,
    instructions: buildInstructions(),
    tools: {
      createEvent: createEventTool,
      listEvents: listEventsTool,
      deleteEvent: deleteEventTool,
      updateEvent: updateEventTool,
      findConflicts: findConflictsTool,
    },
    stopWhen: isStepCount(8),
  });
}
