import { Redis } from "ioredis";
import { HoldsService } from "./holds.service";

describe("HoldsService — concurrency", () => {
  let redis: Redis;
  let holds: HoldsService;

  const eventId = "concurrency-test-event";
  const seatId = "concurrency-test-seat";

  beforeAll(() => {
    redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    holds = new HoldsService(redis);
  });

  afterEach(async () => {
    // Clean up so each test starts from a seat with no hold on it.
    await redis.del(`hold:${eventId}:${seatId}`);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("lets only one acquireHold succeed when many happen at the same time", async () => {
    // TODO: fire N (e.g. 50) concurrent acquireHold calls for the SAME
    // eventId/seatId, each with a DIFFERENT userId (e.g. "user-0".."user-49"),
    // using Promise.all so they actually run concurrently rather than one
    // after another.
    //
    // Hint: build an array of N promises with .map(), each calling
    // holds.acquireHold(eventId, seatId, `user-${i}`).
    //
    // Hint: Promise.all(promises) resolves to an array of N booleans, in the
    // same order you started them. Count how many are `true` — assert it's
    // exactly 1 (use Array.prototype.filter).
  });
});
