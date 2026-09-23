import { Module } from "@nestjs/common";
import { RedisModule } from "./redis/redis.module.js";
import { HoldsModule } from "./holds/holds.module.js";

@Module({
  imports: [RedisModule, HoldsModule],
})
export class AppModule {}
