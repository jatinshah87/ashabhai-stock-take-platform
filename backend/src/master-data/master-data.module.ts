import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { MasterDataController } from "./master-data.controller";
import { MasterDataService } from "./master-data.service";

@Module({
  imports: [AuthModule],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
