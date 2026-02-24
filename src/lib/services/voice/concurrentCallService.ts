import { cacheClient, ensureConnected } from "@/lib/config/valkey";

const CONCURRENT_CALL_LIMITS: Record<string, number> = {
  FREE: 0,
  BASIC: 3,
  PRO: 10,
  AGENCY: 25,
};

const SAFETY_TTL_SECONDS = 3600;

function concurrentKey(orgId: string): string {
  return `voice-concurrent:${orgId}`;
}

export async function incrementConcurrentCalls(orgId: string): Promise<number> {
  try {
    await ensureConnected();
    const key = concurrentKey(orgId);
    const count = await cacheClient.incr(key);
    if (count === 1) {
      await cacheClient.expire(key, SAFETY_TTL_SECONDS);
    }
    return count;
  } catch (err) {
    console.error("[ConcurrentCalls] Failed to increment:", err);
    return 0;
  }
}

export async function decrementConcurrentCalls(orgId: string): Promise<number> {
  try {
    await ensureConnected();
    const key = concurrentKey(orgId);
    const count = await cacheClient.decr(key);
    if (count < 0) {
      await cacheClient.set(key, "0");
      return 0;
    }
    return count;
  } catch (err) {
    console.error("[ConcurrentCalls] Failed to decrement:", err);
    return 0;
  }
}

export function getConcurrentCallLimit(plan: string | null): number {
  return CONCURRENT_CALL_LIMITS[plan ?? "FREE"] ?? 0;
}

export async function checkConcurrentCallLimit(
  orgId: string,
  plan: string | null,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = getConcurrentCallLimit(plan);
  if (limit === 0) return { allowed: false, current: 0, limit: 0 };

  try {
    await ensureConnected();
    const key = concurrentKey(orgId);
    const currentStr = await cacheClient.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    return { allowed: current < limit, current, limit };
  } catch (err) {
    console.error("[ConcurrentCalls] Failed to check limit:", err);
    return { allowed: true, current: 0, limit };
  }
}
