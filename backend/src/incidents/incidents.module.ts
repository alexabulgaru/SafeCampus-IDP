import { Module } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { AuthModule } from "../auth/auth.module";
import { KafkaModule } from "src/kafka/kafka.module";
import { MetricsModule } from "src/metrics/metrics.module";

@Module({
    imports: [PrismaModule, CacheModule, AuthModule, KafkaModule, MetricsModule],
    providers: [IncidentsService],
    controllers: [IncidentsController],
    exports: [IncidentsService],
})
export class IncidentsModule { }
