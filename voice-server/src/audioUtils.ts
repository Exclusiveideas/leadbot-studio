/**
 * Mulaw decode table: maps 8-bit mulaw byte to 16-bit PCM sample.
 * Pre-computed for zero-allocation decoding in the hot path.
 */
const MULAW_DECODE_TABLE = new Int16Array(256);

(function buildMulawTable() {
  for (let i = 0; i < 256; i++) {
    let mu = ~i & 0xff;
    const sign = mu & 0x80 ? -1 : 1;
    mu = mu & 0x7f;
    const exponent = (mu >> 4) & 0x07;
    const mantissa = mu & 0x0f;
    let sample = ((mantissa << 1) + 33) << (exponent + 2);
    sample -= 0x84;
    MULAW_DECODE_TABLE[i] = sign * sample;
  }
})();

/**
 * Decode 8kHz mulaw buffer to 16kHz PCM16 (linear interpolation upsample).
 * Input: Buffer of 8-bit mulaw samples at 8000 Hz
 * Output: Buffer of 16-bit PCM samples at 16000 Hz (little-endian)
 */
export function mulawToLinear16(mulaw: Buffer): Buffer {
  const outputLength = mulaw.length * 2;
  const output = Buffer.alloc(outputLength * 2); // 2 bytes per 16-bit sample

  for (let i = 0; i < mulaw.length; i++) {
    const sample = MULAW_DECODE_TABLE[mulaw[i]!]!;
    const nextSample =
      i + 1 < mulaw.length ? MULAW_DECODE_TABLE[mulaw[i + 1]!]! : sample;

    const interpolated = Math.round((sample + nextSample) / 2);

    const outIdx = i * 2;
    output.writeInt16LE(sample, outIdx * 2);
    output.writeInt16LE(interpolated, (outIdx + 1) * 2);
  }

  return output;
}

/**
 * Encode a mulaw byte from a 16-bit PCM sample.
 */
function encodeMulawSample(sample: number): number {
  const BIAS = 0x84;
  const MAX = 32635;

  const sign = sample < 0 ? 0x80 : 0;
  if (sample < 0) sample = -sample;
  if (sample > MAX) sample = MAX;

  sample += BIAS;

  let exponent = 7;
  const expMask = 0x4000;
  for (; exponent > 0; exponent--) {
    if (sample & expMask) break;
    sample <<= 1;
  }

  const mantissa = (sample >> 10) & 0x0f;
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xff;
  return mulawByte;
}

/**
 * Encode 16kHz PCM16 buffer to 8kHz mulaw (downsample by averaging pairs).
 * Input: Buffer of 16-bit PCM samples at 16000 Hz (little-endian)
 * Output: Buffer of 8-bit mulaw samples at 8000 Hz
 */
export function linear16ToMulaw(pcm16: Buffer): Buffer {
  const sampleCount = pcm16.length / 2;
  const outputLength = Math.floor(sampleCount / 2);
  const output = Buffer.alloc(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const s1 = pcm16.readInt16LE(i * 4);
    const s2 = pcm16.readInt16LE(i * 4 + 2);
    const averaged = Math.round((s1 + s2) / 2);
    output[i] = encodeMulawSample(averaged);
  }

  return output;
}
