const EVENT_TIMEZONE = 'Asia/Kolkata';

export function formatEventDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: EVENT_TIMEZONE,
  }).format(new Date(dateStr));
}

export function formatEventTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: EVENT_TIMEZONE,
  }).format(new Date(dateStr));
}
