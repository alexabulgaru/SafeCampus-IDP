import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
    imports: [MetricsModule],
    providers: [KafkaService],
    exports: [KafkaService],
})
export class KafkaModule {}
