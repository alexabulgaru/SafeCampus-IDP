import { Module } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { AuthModule } from "../auth/auth.module";
import { KafkaModule } from "src/kafka/kafka.module";

@Module({
    imports: [PrismaModule, CacheModule, AuthModule, KafkaModule],
    providers: [IncidentsService],
    controllers: [IncidentsController],
    exports: [IncidentsService],
})
export class IncidentsModule { }
