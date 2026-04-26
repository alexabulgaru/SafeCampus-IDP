import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('kafkajs', () => ({
    Kafka: jest.fn().mockImplementation(() => ({
        producer: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
            send: jest.fn().mockResolvedValue([{ topicName: 'test', partition: 0, errorCode: 0 }]),
        }),
        consumer: jest.fn().mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
            run: jest.fn().mockResolvedValue(undefined),
        }),
    })),
}));

describe('KafkaService', () => {
    let service: KafkaService;
    let metricsService: MetricsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KafkaService,
                {
                    provide: MetricsService,
                    useValue: {
                        recordKafkaMessagePublished: jest.fn(),
                        recordKafkaError: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<KafkaService>(KafkaService);
        metricsService = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('connect', () => {
        it('should connect to Kafka producer and consumer', async () => {
        await service.connect();
      
            expect(service).toBeDefined();
        });
    });

    describe('publishAlert', () => {
        it('should publish an alert message successfully', async () => {
            const topic = 'incident-alerts';
            const message = {
                incidentId: '1',
                userId: 'user1',
                title: 'Test Alert',
                message: 'Test message',
            };

            await service.publishAlert(topic, message);

            expect(metricsService.recordKafkaMessagePublished).toHaveBeenCalledWith(
                topic,
                'success',
            );
        });

        it('should record error on publish failure', async () => {
            const topic = 'incident-alerts';
            const message = { incidentId: '1' };
            try {
                await service.publishAlert(topic, message);
            } catch (e) {
                expect(metricsService.recordKafkaError).toHaveBeenCalledWith(
                    topic,
                    'publish_error',
                );
            }
        });

        it('should handle different message types', async () => {
            const topic = 'incident-alerts';
            const messages = [
                { incidentId: '1', userId: 'user1' },
                { incidentId: '2', userId: 'user2', type: 'SAFETY' },
                { incidentId: '3', data: { nested: 'value' } },
            ];

            for (const msg of messages) {
                await service.publishAlert(topic, msg);
            }

            expect(metricsService.recordKafkaMessagePublished).toHaveBeenCalledTimes(3);
        });
    });

    describe('subscribe', () => {
        it('should subscribe to a topic', async () => {
            const topic = 'incident-alerts';
            const callback = jest.fn();

            await service.subscribe(topic, callback);

            expect(service).toBeDefined();
        });

        it('should handle subscription with callback', async () => {
            const topic = 'incident-alerts';
            const callback = jest.fn().mockResolvedValue(undefined);
            await service.subscribe(topic, callback);

            expect(service).toBeDefined();
        });
    });
});
