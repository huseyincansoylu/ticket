import { Global, Module } from "@nestjs/common";
import { Redis } from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(process.env.REDIS_URL ?? "redis://localhost:6379"),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
