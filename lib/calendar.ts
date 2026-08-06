import { google, calendar_v3 } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

function getCalendarClient() {
  // Trim defensively — env values pasted through a dashboard UI can pick up
  // a trailing newline, which silently breaks OAuth ("invalid_client").
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

async function withGoogleErrorLogging<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      response?: { status?: number; data?: unknown };
    };
    console.error(`[calendar] ${label} failed`, {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    throw error;
  }
}

export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  startISO: string;
  endISO: string;
}

export interface EventSummary {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  htmlLink?: string;
}

function toSummary(event: calendar_v3.Schema$Event): EventSummary {
  return {
    id: event.id!,
    summary: event.summary ?? undefined,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: event.start?.dateTime ?? event.start?.date ?? undefined,
    end: event.end?.dateTime ?? event.end?.date ?? undefined,
    htmlLink: event.htmlLink ?? undefined,
  };
}

export async function createEvent(input: EventInput): Promise<EventSummary> {
  return withGoogleErrorLogging("createEvent", async () => {
    const calendar = getCalendarClient();
    const { data } = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startISO },
        end: { dateTime: input.endISO },
      },
    });
    return toSummary(data);
  });
}

export async function listEvents(params: {
  timeMinISO: string;
  timeMaxISO: string;
  maxResults?: number;
}): Promise<EventSummary[]> {
  return withGoogleErrorLogging("listEvents", async () => {
    const calendar = getCalendarClient();
    const { data } = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: params.timeMinISO,
      timeMax: params.timeMaxISO,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: params.maxResults ?? 20,
    });
    return (data.items ?? []).map(toSummary);
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
}

export async function updateEvent(input: {
  eventId: string;
  summary?: string;
  description?: string;
  location?: string;
  startISO?: string;
  endISO?: string;
}): Promise<EventSummary> {
  const calendar = getCalendarClient();
  const { data } = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId: input.eventId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: input.startISO ? { dateTime: input.startISO } : undefined,
      end: input.endISO ? { dateTime: input.endISO } : undefined,
    },
  });
  return toSummary(data);
}

export async function findConflicts(params: {
  startISO: string;
  endISO: string;
}): Promise<EventSummary[]> {
  return listEvents({ timeMinISO: params.startISO, timeMaxISO: params.endISO });
}
