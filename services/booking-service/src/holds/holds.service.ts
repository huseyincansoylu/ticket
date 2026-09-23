import { Inject, Injectable } from "@nestjs/common";
import type { Redis } from "ioredis";
import type { Hold } from "@ticket/shared-types";
import { REDIS_CLIENT } from "../redis/redis.module";

export const HOLD_TTL_SECONDS = 600; // 10 minutes

@Injectable()
export class HoldsService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

  private holdKey(eventId: string, seatId: string): string {
    return `hold:${eventId}:${seatId}`;
  }

  /**
   * Try to acquire a hold on a seat for a user.
   *
   * Hint: this must be a single atomic Redis command — see the SET NX EX
   * discussion earlier in this project. Returns true if the hold was
   * acquired, false if the seat was already held by someone else.
   */
  async acquireHold(eventId: string, seatId: string, userId: string): Promise<boolean> {
    const key = this.holdKey(eventId, seatId);
    const result = await this.redis.set(key, userId, "EX", HOLD_TTL_SECONDS, "NX");
    return result === "OK";
  }

  /**
   * Release a hold — but ONLY if `userId` is the current holder.
   *
   * Hint: a plain DEL is unsafe (see the compare-and-delete discussion —
   * TTL could expire and a different user could grab the seat between your
   * check and your delete). Use `this.redis.eval(script, 1, key, userId)`
   * with a Lua script that does the GET + compare + DEL atomically.
   *
   * Returns true if a hold owned by this user was released, false if there
   * was no hold, or it belonged to someone else.
   */
  async releaseHold(eventId: string, seatId: string, userId: string): Promise<boolean> {
    const key = this.holdKey(eventId, seatId);

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, userId);

    return result === 1;
  }

  /**
   * Look up the current hold on a seat, if any.
   *
   * Hint: `this.redis.get(key)` gives you the userId (or null). You'll also
   * need the remaining TTL to compute `expiresAt` — look at `this.redis.pttl`
   * (milliseconds) or `ttl` (seconds).
   */
  async getHold(eventId: string, seatId: string): Promise<Hold | null> {
    const key = this.holdKey(eventId, seatId);

    const userId = await this.redis.get(key);
    if (userId === null) {
      return null;
    }

    const ttlMs = await this.redis.pttl(key);
    const expiresAt = new Date(Date.now() + ttlMs);

    return { eventId, seatId, userId, expiresAt };
  }

}
