export function interpolate(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => String(data[key.trim()] ?? ''));
}
