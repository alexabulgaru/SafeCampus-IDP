import { Module } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CacheModule } from "../cache/cache.module";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "src/notifications/notifications.module";

@Module({
    imports: [PrismaModule, CacheModule, AuthModule, NotificationsModule],
    providers: [IncidentsService],
    controllers: [IncidentsController],
    exports: [IncidentsService],
})
export class IncidentsModule { }
