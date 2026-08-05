export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 480 }}>
      <h1>Telegram Calendar Bot</h1>
      <p>This deployment exposes:</p>
      <ul>
        <li>
          <code>POST /api/telegram</code> — Telegram webhook
        </li>
        <li>
          <code>GET /api/cron/reminders</code> — scheduled reminder check
        </li>
      </ul>
      <p>Talk to the bot on Telegram to manage your Google Calendar.</p>
    </main>
  );
}
