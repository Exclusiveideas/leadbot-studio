import { describe, expect, test } from "vitest";
import { createSentenceSplitter } from "./sentenceSplitter.js";

describe("createSentenceSplitter", () => {
  test("emits complete sentences at period boundaries", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("Hello there. ");
    splitter.push("How are you? ");
    splitter.push("I am fine.");
    splitter.flush();

    expect(sentences).toEqual(["Hello there.", "How are you?", "I am fine."]);
  });

  test("buffers incomplete sentences until boundary", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("Hello ");
    splitter.push("there");
    expect(sentences).toEqual([]);

    splitter.push(". How are you? ");
    expect(sentences).toEqual(["Hello there.", "How are you?"]);
  });

  test("flush emits remaining buffered text", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("Incomplete sentence");
    expect(sentences).toEqual([]);

    splitter.flush();
    expect(sentences).toEqual(["Incomplete sentence"]);
  });

  test("handles exclamation marks as boundaries", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("Great news! We can help. ");
    expect(sentences).toEqual(["Great news!", "We can help."]);
  });

  test("handles multiple punctuation marks", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("Really?! That's amazing. ");
    expect(sentences).toEqual(["Really?!", "That's amazing."]);
  });

  test("does not emit empty strings", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    splitter.push("  ");
    splitter.flush();
    expect(sentences).toEqual([]);
  });

  test("handles streaming character-by-character input", () => {
    const sentences: string[] = [];
    const splitter = createSentenceSplitter((s) => sentences.push(s));

    const text = "Hi. Bye. ";
    for (const char of text) {
      splitter.push(char);
    }

    expect(sentences).toEqual(["Hi.", "Bye."]);
  });
});
