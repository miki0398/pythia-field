// Why: Handle Google Calendar OAuth flow and read calendar events
import { callPythia } from "./pythia-api";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/oauth/calendar/callback`;

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; responseStatus: string }>;
}

// Why: Initiate OAuth flow when user clicks "Connect Calendar"
export function initiateCalendarOAuth() {
  const scope = "https://www.googleapis.com/auth/calendar.readonly";
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  window.location.href = authUrl.toString();
}

// Why: Exchange authorization code for access token via secure Worker endpoint
export async function exchangeCodeForToken(code: string): Promise<string> {
  const workerUrl = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";
  
  const response = await fetch(`${workerUrl}/calendar/token-exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code,
      redirectUri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Why: Read calendar events
export async function readCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  return data.items || [];
}