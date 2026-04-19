import { Module } from "@nestjs/common";
import { AuditLogModule } from "src/audit-log/audit-log.module";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";

@Module({
  imports: [AuditLogModule],
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}
