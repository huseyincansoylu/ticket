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
    const concurrentUsers = 50;

    const promises = Array.from({ length: concurrentUsers }, (_, i) =>
      holds.acquireHold(eventId, seatId, `user-${i}`),
    );

    const results = await Promise.all(promises);

    const successes = results.filter((result) => result === true);
    expect(successes).toHaveLength(1);
  });
});
