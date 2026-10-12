export const MIN_POSTS = 3;
export const RECOMMENDED_POSTS = 5;
export const MAX_POSTS = 20;
export const MIN_POST_CHARS = 40;
export const MAX_POST_CHARS = 20_000;

export const MIN_POSTS_MESSAGE = `We need at least ${MIN_POSTS} posts to learn your voice. Paste a few more.`;
export const TOO_LONG_MESSAGE = `One of your posts is longer than ${MAX_POST_CHARS.toLocaleString("en-US")} characters. Split it with a --- line or shorten it.`;

const key = (p: string) => p.toLowerCase().replace(/\s+/g, " ").trim();

// Pasted text: posts are separated by a line that contains only "---".
export function splitPasted(text: string): string[] {
  return text.split(/^\s*---\s*$/m).map((p) => p.trim());
}

// Minimal RFC 4180 parser: quoted fields, "" escapes, newlines inside quotes, BOM.
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

// LinkedIn's Shares.csv: columns Date, ShareLink, ShareCommentary, ... Newest posts first.
export function postsFromSharesCsv(csv: string): string[] {
  const [header, ...rows] = parseCsv(csv);
  const col = (name: string) => header?.findIndex((h) => h.trim().toLowerCase() === name) ?? -1;
  const text = col("sharecommentary");
  const date = col("date");
  if (text < 0) return [];
  return rows
    .map((r) => ({ text: (r[text] ?? "").trim(), date: date >= 0 ? (r[date] ?? "") : "" }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((r) => r.text);
}

export type Selection = {
  posts: string[];
  truncated: boolean; // more than MAX_POSTS were found
  tooLong: boolean;
};

// Drops too-short and duplicate posts, keeps the first MAX_POSTS.
export function selectPosts(raw: string[]): Selection {
  const seen = new Set<string>();
  const posts: string[] = [];
  for (const p of raw) {
    const t = p.trim();
    if (t.length < MIN_POST_CHARS || seen.has(key(t))) continue;
    seen.add(key(t));
    posts.push(t);
  }
  return {
    posts: posts.slice(0, MAX_POSTS),
    truncated: posts.length > MAX_POSTS,
    tooLong: posts.some((p) => p.length > MAX_POST_CHARS),
  };
}

export const duplicateKey = key;
