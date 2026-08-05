import { tool } from "ai";
import { z } from "zod";
import * as calendar from "../calendar";

const isoWithOffset = z
  .string()
  .describe(
    "ISO 8601 date-time including a timezone offset, e.g. 2026-08-06T14:00:00-04:00",
  );

export const createEventTool = tool({
  description: "Create a new event on the user's Google Calendar.",
  inputSchema: z.object({
    summary: z.string().describe("Short event title"),
    description: z.string().optional(),
    location: z.string().optional(),
    startISO: isoWithOffset,
    endISO: isoWithOffset,
  }),
  execute: async (input) => calendar.createEvent(input),
});

export const listEventsTool = tool({
  description:
    "List events on the calendar within a time range. Use this to find an event's ID before updating or deleting it, or to answer questions about the user's schedule.",
  inputSchema: z.object({
    timeMinISO: isoWithOffset,
    timeMaxISO: isoWithOffset,
  }),
  execute: async ({ timeMinISO, timeMaxISO }) =>
    calendar.listEvents({ timeMinISO, timeMaxISO }),
});

export const deleteEventTool = tool({
  description:
    "Delete/cancel an event by its event ID. Look up the ID with listEvents first if you don't already have it.",
  inputSchema: z.object({
    eventId: z.string(),
  }),
  execute: async ({ eventId }) => {
    await calendar.deleteEvent(eventId);
    return { deleted: true, eventId };
  },
});

export const updateEventTool = tool({
  description:
    "Update or reschedule an existing event. Only pass the fields that change.",
  inputSchema: z.object({
    eventId: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    startISO: isoWithOffset.optional(),
    endISO: isoWithOffset.optional(),
  }),
  execute: async (input) => calendar.updateEvent(input),
});

export const findConflictsTool = tool({
  description:
    "Check for events that overlap a given time range. Call this before creating an event to detect double-booking.",
  inputSchema: z.object({
    startISO: isoWithOffset,
    endISO: isoWithOffset,
  }),
  execute: async ({ startISO, endISO }) =>
    calendar.findConflicts({ startISO, endISO }),
});
