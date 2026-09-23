import { Global, Module } from "@nestjs/common";
import Iyzipay from "iyzipay";

export const IYZICO_CLIENT = "IYZICO_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: IYZICO_CLIENT,
      useFactory: () =>
        new Iyzipay({
          uri: process.env.IYZICO_URI ?? "https://sandbox-api.iyzipay.com",
          apiKey: process.env.IYZICO_API_KEY ?? "",
          secretKey: process.env.IYZICO_SECRET_KEY ?? "",
        }),
    },
  ],
  exports: [IYZICO_CLIENT],
})
export class IyzicoModule {}
