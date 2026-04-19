import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { MasterDataModule } from "./master-data/master-data.module";
import { StockTakePlansModule } from "./stock-take-plans/stock-take-plans.module";
import { InventoryModule } from "./inventory/inventory.module";
import { CountExecutionModule } from "./count-execution/count-execution.module";
import { ReportsModule } from "./reports/reports.module";
import { IntegrationModule } from "./integration/integration.module";
import { SyncModule } from "./sync/sync.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { VoiceModule } from "./voice/voice.module";
import { AnomaliesModule } from "./anomalies/anomalies.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    MasterDataModule,
    StockTakePlansModule,
    InventoryModule,
    CountExecutionModule,
    ReportsModule,
    IntegrationModule,
    SyncModule,
    AnalyticsModule,
    VoiceModule,
    AnomaliesModule,
  ],
})
export class AppModule {}
