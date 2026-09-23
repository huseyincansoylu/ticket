import { Module } from "@nestjs/common";
import { RedisModule } from "./redis/redis.module";
import { HoldsModule } from "./holds/holds.module";

@Module({
  imports: [RedisModule, HoldsModule],
})
export class AppModule {}
