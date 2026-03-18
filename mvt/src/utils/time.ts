export function nowIso(): string {
  return new Date().toISOString();
}

export function todayUtcDate(): string {
  return nowIso().slice(0, 10);
}
