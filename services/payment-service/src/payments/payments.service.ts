import { Inject, Injectable } from "@nestjs/common";
import type Iyzipay from "iyzipay";
import { IYZICO_CLIENT } from "../iyzico/iyzico.module";
import { PRISMA_CLIENT } from "../prisma/prisma.module";
import type { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(IYZICO_CLIENT) private readonly iyzico: Iyzipay,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  /**
   * Start a payment for an order: create a PENDING Payment row, then ask
   * iyzico for a hosted checkout page and return its URL to the frontend.
   *
   * Idempotency: derive `idempotencyKey` deterministically from `orderId`
   * (e.g. `payment:${orderId}`). Prisma's `@unique` on that column means a
   * second attempt to initiate payment for the SAME order — a double click,
   * or a retry after a flaky network response — throws instead of creating
   * a second Payment row. You'll need to decide what to do when that happens
   * (hint: look up the existing row and return its info instead of failing).
   *
   * Hint: `this.iyzico.checkoutFormInitialize.create({...}, callback)` uses
   * a Node-style callback, not a Promise — you'll want to wrap it in
   * `new Promise((resolve, reject) => ...)` to use it with async/await.
   */
  async initiatePayment(orderId: string, amount: string, currency: string) {
    throw new Error("not implemented");
  }

  /**
   * Handle iyzico's webhook notification for a payment result.
   *
   * Two things to get right, in order:
   *
   * 1. Verify the request genuinely came from iyzico before trusting it.
   *    Check iyzico's docs for the CheckoutForm webhook payload shape and
   *    signature header (their sandbox dashboard has example payloads) —
   *    the SDK's docs show two related patterns: a header-based signature
   *    (X-IYZ-SIGNATURE-V3) for direct webhook notifications, and a
   *    field-concatenation + HMAC-SHA256 signature returned alongside
   *    `checkoutForm.retrieve()` results. Confirm which applies to your
   *    sandbox setup before writing the verification code.
   *
   * 2. Idempotency: a webhook can legitimately arrive more than once for the
   *    same payment (iyzico retries on timeout). Before updating anything,
   *    check whether this Payment is already in a terminal state
   *    (SUCCEEDED/FAILED) — if so, this is a duplicate delivery, do nothing
   *    and return early. Only update status on the first delivery.
   */
  async handleWebhook(body: unknown, headers: Record<string, unknown>) {
    throw new Error("not implemented");
  }
}
