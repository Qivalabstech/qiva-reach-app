import { describe, expect, it } from "vitest";
import { parseCsv, postsFromSharesCsv, selectPosts, splitPasted } from "../src/lib/voice-import";

const long = (n: number) => `Post number ${n} about building in public and shipping every week.`;

describe("splitPasted", () => {
  it("splits on a --- line and trims", () => {
    expect(splitPasted(`  one  \n---\n\ntwo\n\n  ---  \nthree\n---\n`)).toEqual(["one", "two", "three", ""]);
  });
  it("keeps --- inside a sentence", () => {
    expect(splitPasted("a --- b")).toEqual(["a --- b"]);
  });
});

describe("parseCsv", () => {
  it("handles quoted newlines, escaped quotes, CRLF and BOM", () => {
    const csv = '﻿a,b\r\n"line1\nline2","say ""hi"""\r\nx,y\r\n';
    expect(parseCsv(csv)).toEqual([["a", "b"], ["line1\nline2", 'say "hi"'], ["x", "y"]]);
  });
});

describe("postsFromSharesCsv", () => {
  const csv = [
    "Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility",
    `2024-01-01 10:00:00,l1,"${long(1)}\nSecond line",,,MEMBER_NETWORK`,
    `2024-03-01 10:00:00,l2,${long(2)},,,MEMBER_NETWORK`,
  ].join("\n");
  it("reads ShareCommentary, newest first, keeping multi-line posts", () => {
    const posts = postsFromSharesCsv(csv);
    expect(posts[0]).toBe(long(2));
    expect(posts[1]).toBe(`${long(1)}\nSecond line`);
  });
  it("returns nothing when the column is missing", () => {
    expect(postsFromSharesCsv("a,b\n1,2")).toEqual([]);
  });
});

describe("selectPosts", () => {
  it("drops short posts and duplicates (ignoring case and spacing)", () => {
    const r = selectPosts([long(1), "too short", long(1).toUpperCase().replace(/ /g, "  "), long(2)]);
    expect(r.posts).toEqual([long(1), long(2)]);
  });
  it("keeps the first 20 and reports truncation", () => {
    const r = selectPosts(Array.from({ length: 25 }, (_, i) => long(i)));
    expect(r.posts).toHaveLength(20);
    expect(r.truncated).toBe(true);
  });
  it("flags a post over 20,000 characters", () => {
    expect(selectPosts(["x".repeat(20_001)]).tooLong).toBe(true);
    expect(selectPosts(["x".repeat(20_000)]).tooLong).toBe(false);
  });
});
