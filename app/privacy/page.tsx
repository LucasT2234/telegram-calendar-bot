export default function Privacy() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 640, lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>
      <p>
        Telegram Calendar Bot is a personal-use application that connects a
        Telegram bot to a Google Calendar account on behalf of its owner. This
        page describes what data it accesses and how that data is handled.
      </p>

      <h2>What this app accesses</h2>
      <ul>
        <li>
          <strong>Google Calendar data</strong> — via Google&apos;s Calendar API
          (OAuth scope: <code>https://www.googleapis.com/auth/calendar</code>),
          this app can read, create, update, and delete events on the
          authorized Google account&apos;s calendar, strictly to fulfill
          requests made through the Telegram chat.
        </li>
        <li>
          <strong>Telegram messages</strong> — messages sent to the bot are
          read to determine what calendar action to take, and to maintain
          short-term conversational context (the most recent messages in a
          chat thread).
        </li>
      </ul>

      <h2>How data is used and stored</h2>
      <ul>
        <li>
          Google account access is authorized via OAuth2. The resulting
          refresh token is stored as an encrypted environment variable in
          this app&apos;s hosting provider (Vercel) and is never shared with
          any third party.
        </li>
        <li>
          Calendar event data is not stored by this app beyond what&apos;s
          needed to process a single request — it is read from and written
          directly to the user&apos;s own Google Calendar.
        </li>
        <li>
          Message text is sent to a large language model provider (Google
          Gemini) solely to interpret the request and generate a response.
          It is not used for any purpose beyond answering that request.
        </li>
        <li>
          This app does not sell, rent, or share personal data with
          advertisers or unrelated third parties.
        </li>
      </ul>

      <h2>Who can use this app</h2>
      <p>
        This is a personal project intended for use by its owner and a small
        number of people the owner has explicitly authorized. It is not
        offered as a general public service.
      </p>

      <h2>Revoking access</h2>
      <p>
        Access can be revoked at any time from{" "}
        <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
          Google Account permissions
        </a>
        , which immediately invalidates this app&apos;s access to the
        calendar.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or this app&apos;s data handling can be
        sent to{" "}
        <a href="mailto:toh.lucas22@gmail.com">toh.lucas22@gmail.com</a>.
      </p>
    </main>
  );
}
