const norm = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'");

// Returns the banned phrases found in the text (case-insensitive, curly quotes treated as straight).
export function findBanned(text: string, banned: string[]): string[] {
  const t = norm(text);
  return banned.filter((b) => b.trim() && t.includes(norm(b.trim())));
}

const NUMBER = /\d+(?:[.,]\d+)?/g;

// Numbers that appear in the output but not in what the user supplied.
export function inventedNumbers(output: string, supplied: string): string[] {
  const allowed = new Set(supplied.match(NUMBER) ?? []);
  return (output.match(NUMBER) ?? []).filter((n) => !allowed.has(n));
}
