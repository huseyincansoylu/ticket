import { Module } from "@nestjs/common";
import { HoldsController } from "./holds.controller";
import { HoldsService } from "./holds.service";

@Module({
  controllers: [HoldsController],
  providers: [HoldsService],
})
export class HoldsModule {}
