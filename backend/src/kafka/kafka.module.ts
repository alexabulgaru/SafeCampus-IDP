import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';

@Module({
    imports: [],
    providers: [KafkaService],
    exports: [KafkaService],
})
export class KafkaModule { }
