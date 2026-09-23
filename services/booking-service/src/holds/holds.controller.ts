import { Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { HoldsService } from "./holds.service.js";

@Controller("events/:eventId/seats/:seatId/hold")
export class HoldsController {
  constructor(private readonly holds: HoldsService) {}

  @Post()
  async create(@Param("eventId") eventId: string, @Param("seatId") seatId: string, @Body("userId") userId: string) {
    const acquired = await this.holds.acquireHold(eventId, seatId, userId);
    if (!acquired) {
      throw new ConflictException("Seat already held");
    }
    return { eventId, seatId, userId };
  }

  @Delete()
  async release(@Param("eventId") eventId: string, @Param("seatId") seatId: string, @Body("userId") userId: string) {
    const released = await this.holds.releaseHold(eventId, seatId, userId);
    if (!released) {
      throw new NotFoundException("Hold not found or not owned by this user");
    }
    return { released: true };
  }

  @Get()
  async get(@Param("eventId") eventId: string, @Param("seatId") seatId: string) {
    return this.holds.getHold(eventId, seatId);
  }
}
