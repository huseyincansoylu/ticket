import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("orders/:orderId/payment")
  async initiate(@Param("orderId") orderId: string, @Body() body: { amount: string; currency: string }) {
    return this.payments.initiatePayment(orderId, body.amount, body.currency);
  }

  @Post("webhooks/iyzico")
  async handleWebhook(@Req() req: Request) {
    return this.payments.handleWebhook(req.body, req.headers);
  }
}
