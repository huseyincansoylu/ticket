import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type Iyzipay from "iyzipay";
import * as crypto from "node:crypto";
import { IYZICO_CLIENT } from "../iyzico/iyzico.module";
import { PRISMA_CLIENT } from "../prisma/prisma.module";
import type { PrismaClient } from "../generated/prisma/client";

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(IYZICO_CLIENT) private readonly iyzico: Iyzipay,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
  ) { }

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
    const idempotencyKey = `payment:${orderId}`;

    let payment;
    try {
      payment = await this.prisma.payment.create({
        data: { orderId, amount, currency, idempotencyKey },
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        // Bu orderId için zaten bir Payment var — yeni oluşturmak yerine mevcudu kullan.
        payment = await this.prisma.payment.findUniqueOrThrow({
          where: { idempotencyKey },
        });
      } else {
        throw error;
      }
    }

    // iyzico's checkoutFormInitialize.create is callback-style, not
    // Promise-based, so it's wrapped here. Note: @types/iyzipay's request
    // type requires a `paymentCard` field that doesn't actually apply to
    // the hosted Checkout Form flow (you never collect card details
    // yourself), so the request object is cast with `as any` below —
    // verified against a real sandbox call. The real response also includes
    // `paymentPageUrl` and `payWithIyzicoPageUrl` (redirect targets) and a
    // `signature` field, none of which are in this community type package's
    // `CheckoutFormInitialResult` — useful for `handleWebhook` later.
    const checkoutForm = await new Promise<Iyzipay.CheckoutFormInitialResult>((resolve, reject) => {
      this.iyzico.checkoutFormInitialize.create(
        {
          locale: "tr",
          conversationId: orderId,
          price: amount,
          paidPrice: amount,
          currency,
          installments: 1,
          basketId: orderId,
          paymentGroup: "PRODUCT",
          callbackUrl: `${process.env.APP_URL ?? "http://localhost:4002"}/payments/callback`,
          buyer: {
            id: `buyer-${orderId}`,
            name: "Test",
            surname: "User",
            email: "test-buyer@example.com",
            identityNumber: "74300864791",
            registrationAddress: "Test address, no. 1",
            ip: "85.34.78.112",
            city: "Istanbul",
            country: "Turkey",
          },
          shippingAddress: {
            contactName: "Test User",
            city: "Istanbul",
            country: "Turkey",
            address: "Test address, no. 1",
          },
          billingAddress: {
            contactName: "Test User",
            city: "Istanbul",
            country: "Turkey",
            address: "Test address, no. 1",
          },
          basketItems: [
            {
              id: orderId,
              name: `Order ${orderId}`,
              category1: "Tickets",
              itemType: "VIRTUAL",
              price: amount,
            },
          ],
        } as any,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        },
      );
    });

    return checkoutForm;
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
  async handleWebhook(body: any, headers: Record<string, unknown>) {
    // 1. Verify the signature before trusting anything in `body`.
    const secretKey = process.env.IYZICO_SECRET_KEY ?? "";
    const message = `${body.iyziEventType}${body.paymentId}${body.paymentConversationId}${body.status}`;
    const expectedSignature = crypto.createHmac("sha256", secretKey).update(message).digest("hex");

    const receivedSignature = headers["x-iyz-signature-v3"];
    if (typeof receivedSignature !== "string") {
      throw new UnauthorizedException("Missing webhook signature");
    }

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(receivedSignature, "hex");

    // timingSafeEqual throws if the buffers differ in length, so check that
    // first — a plain `!==` on lengths leaks no useful timing information.
    const signatureValid =
      expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    // 2. Idempotency: look up the Payment this webhook refers to.
    const idempotencyKey = `payment:${body.paymentConversationId}`;
    const payment = await this.prisma.payment.findUnique({ where: { idempotencyKey } });

    if (!payment) {
      // Signature was valid but we have no matching Payment — nothing to do.
      return { received: true };
    }

    if (payment.status === "SUCCEEDED" || payment.status === "FAILED") {
      // Already in a terminal state — this is a duplicate delivery, ignore it.
      return { received: true };
    }

    await this.prisma.payment.update({
      where: { idempotencyKey },
      data: {
        status: body.status === "SUCCESS" ? "SUCCEEDED" : "FAILED",
        iyzicoPaymentId: body.paymentId,
      },
    });

    return { received: true };
  }
}
