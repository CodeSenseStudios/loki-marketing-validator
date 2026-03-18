export function toSection(title: string, body: string): string {
  return `## ${title}\n${body.trim()}\n`;
}

export function extractSection(markdown: string, title: string): string {
  const marker = `## ${title}`;
  const index = markdown.indexOf(marker);
  if (index === -1) {
    return '';
  }
  const after = markdown.slice(index + marker.length);
  const nextHeader = after.search(/\n##\s+/);
  return (nextHeader === -1 ? after : after.slice(0, nextHeader)).trim();
}
