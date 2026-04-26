import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
    imports: [PrismaModule, KafkaModule],
    providers: [NotificationService],
    controllers: [NotificationsController],
    exports: [NotificationService],
})
export class NotificationsModule { }
