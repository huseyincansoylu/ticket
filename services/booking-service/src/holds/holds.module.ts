import { Module } from "@nestjs/common";
import { HoldsController } from "./holds.controller.js";
import { HoldsService } from "./holds.service.js";

@Module({
  controllers: [HoldsController],
  providers: [HoldsService],
})
export class HoldsModule {}
