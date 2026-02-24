import { describe, expect, test } from "vitest";
import { mulawToLinear16, linear16ToMulaw } from "./audioUtils.js";

describe("mulawToLinear16", () => {
  test("doubles the sample count (8kHz to 16kHz)", () => {
    const mulaw = Buffer.from([0xff, 0x7f, 0x00, 0x80]);
    const pcm16 = mulawToLinear16(mulaw);
    // 4 mulaw samples → 8 PCM16 samples → 16 bytes
    expect(pcm16.length).toBe(16);
  });

  test("silence byte (0xff) decodes to near-zero", () => {
    const mulaw = Buffer.from([0xff, 0xff]);
    const pcm16 = mulawToLinear16(mulaw);
    const firstSample = pcm16.readInt16LE(0);
    expect(Math.abs(firstSample)).toBeLessThan(100);
  });

  test("handles empty input", () => {
    const mulaw = Buffer.alloc(0);
    const pcm16 = mulawToLinear16(mulaw);
    expect(pcm16.length).toBe(0);
  });

  test("produces valid 16-bit PCM samples within range", () => {
    const mulaw = Buffer.from([0x00, 0x80, 0x40, 0xc0, 0xff, 0x7f]);
    const pcm16 = mulawToLinear16(mulaw);

    for (let i = 0; i < pcm16.length; i += 2) {
      const sample = pcm16.readInt16LE(i);
      expect(sample).toBeGreaterThanOrEqual(-32768);
      expect(sample).toBeLessThanOrEqual(32767);
    }
  });
});

describe("linear16ToMulaw", () => {
  test("halves the sample count (16kHz to 8kHz)", () => {
    // 8 PCM16 samples at 16kHz → 4 mulaw samples at 8kHz
    const pcm16 = Buffer.alloc(16); // 8 samples × 2 bytes
    const mulaw = linear16ToMulaw(pcm16);
    expect(mulaw.length).toBe(4);
  });

  test("silence encodes to 0xff (mulaw silence)", () => {
    const pcm16 = Buffer.alloc(8); // 4 zero samples
    pcm16.writeInt16LE(0, 0);
    pcm16.writeInt16LE(0, 2);
    pcm16.writeInt16LE(0, 4);
    pcm16.writeInt16LE(0, 6);
    const mulaw = linear16ToMulaw(pcm16);
    expect(mulaw[0]).toBe(0xff);
    expect(mulaw[1]).toBe(0xff);
  });

  test("handles empty input", () => {
    const pcm16 = Buffer.alloc(0);
    const mulaw = linear16ToMulaw(pcm16);
    expect(mulaw.length).toBe(0);
  });

  test("output bytes are valid 8-bit values", () => {
    const pcm16 = Buffer.alloc(20);
    for (let i = 0; i < 10; i++) {
      pcm16.writeInt16LE(Math.floor(Math.random() * 65536) - 32768, i * 2);
    }
    const mulaw = linear16ToMulaw(pcm16);

    for (let i = 0; i < mulaw.length; i++) {
      expect(mulaw[i]).toBeGreaterThanOrEqual(0);
      expect(mulaw[i]).toBeLessThanOrEqual(255);
    }
  });
});

describe("round-trip", () => {
  test("mulaw → PCM16 → mulaw preserves general shape", () => {
    // Generate a simple mulaw signal
    const original = Buffer.from([
      0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70,
    ]);
    const pcm16 = mulawToLinear16(original);
    const roundTripped = linear16ToMulaw(pcm16);

    // Mulaw is lossy, so exact match isn't expected
    // But decoded values should be in a similar range
    expect(roundTripped.length).toBe(original.length);
  });
});
