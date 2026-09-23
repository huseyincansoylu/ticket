import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { IyzicoModule } from "./iyzico/iyzico.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [PrismaModule, IyzicoModule, PaymentsModule],
})
export class AppModule {}
