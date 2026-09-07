export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function sortDesc<T>(items: T[], key: (item: T) => number): T[] {
  return items.sort((a, b) => key(b) - key(a));
}

export function person(name: string, url?: string) {
  return { '@type': 'Person', name, ...(url ? { url } : {}) };
}
