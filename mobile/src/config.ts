export function nativeClipFormat(uri: string) {
  return uri.split("?")[0].toLowerCase().endsWith(".mov")
    ? { mimeType: "video/quicktime", uti: "com.apple.quicktime-movie" }
    : { mimeType: "video/mp4", uti: "public.mpeg-4" };
}
export function validateAppUrl(value: string, development = false) {
  const url = new URL(value.trim());
  const local =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    /^10\.\d+\.\d+\.\d+$/.test(url.hostname) ||
    /^192\.168\.\d+\.\d+$/.test(url.hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(url.hostname);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" &&
      !(development && url.protocol === "http:" && local))
  )
    throw Error(
      "Use your deployed HTTPS app address, without a query, fragment, or credentials. A private LAN HTTP address is allowed only during development.",
    );
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(url.pathname))
    throw Error(
      "Use the full HTTPS app address, with a trailing slash for a hosted project, such as https://example.github.io/congressapp/.",
    );
  return url.origin + (url.pathname === "/" ? "" : url.pathname);
}
export function isAppDocumentUrl(value: string, appUrl: string) {
  try {
    const next = new URL(value),
      app = new URL(appUrl);
    return (
      next.origin === app.origin &&
      (app.pathname === "/" || next.pathname.startsWith(app.pathname))
    );
  } catch {
    return false;
  }
}
export function validReminderSchedule(value: unknown): {
  days: number[];
  hour: number;
  minute: number;
} {
  const schedule = value as { days: number[]; hour: number; minute: number };
  if (
    !schedule ||
    !Array.isArray(schedule.days) ||
    !schedule.days.length ||
    schedule.days.length > 7 ||
    schedule.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
    !Number.isInteger(schedule.hour) ||
    schedule.hour < 0 ||
    schedule.hour > 23 ||
    !Number.isInteger(schedule.minute) ||
    schedule.minute < 0 ||
    schedule.minute > 59
  )
    throw Error("Choose weekdays and a valid local time.");
  return {
    days: [...new Set(schedule.days)],
    hour: schedule.hour,
    minute: schedule.minute,
  };
}
