import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

describe('MetricsService', () => {
    let service: MetricsService;

    beforeEach(async () => {
        register.clear();

        const module: TestingModule = await Test.createTestingModule({
            providers: [MetricsService],
        }).compile();

        service = module.get<MetricsService>(MetricsService);
    });

    afterEach(() => {
        register.clear();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('recordHttpRequest', () => {
        it('should record HTTP request metric', () => {
            const method = 'GET';
            const route = '/incidents';
            const statusCode = 200;
            const duration = 0.5;

            expect(() => {
                service.recordHttpRequest(method, route, statusCode, duration);
            }).not.toThrow();
        });

        it('should record with different methods', () => {
            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            
            methods.forEach((method) => {
                expect(() => {
                    service.recordHttpRequest(method, '/test', 200, 0.1);
                }).not.toThrow();
            });
        });

        it('should record with different status codes', () => {
            const statusCodes = [200, 201, 400, 404, 500];
            
            statusCodes.forEach((statusCode) => {
                expect(() => {
                    service.recordHttpRequest('GET', '/test', statusCode, 0.1);
                }).not.toThrow();
            });
        });
    });

    describe('recordIncidentCreated', () => {
        it('should record incident created metric', () => {
            const type = 'SAFETY';
            const status = 'OPEN';

            expect(() => {
                service.recordIncidentCreated(type, status);
            }).not.toThrow();
        });

        it('should record with different incident types', () => {
            const types = ['SAFETY', 'MEDICAL', 'MAINTENANCE', 'USUAL'];
            
            types.forEach((type) => {
                expect(() => {
                    service.recordIncidentCreated(type, 'OPEN');
                }).not.toThrow();
            });
        });
    });

    describe('recordNotificationCreated', () => {
        it('should record notification created metric', () => {
            const role = 'STUDENT';
            const type = 'SAFETY';

            expect(() => {
                service.recordNotificationCreated(role, type);
            }).not.toThrow();
        });

        it('should record with different roles', () => {
            const roles = ['STUDENT', 'OPERATOR', 'MAINTENANCE', 'ADMIN'];
            
            roles.forEach((role) => {
                expect(() => {
                    service.recordNotificationCreated(role, 'SAFETY');
                }).not.toThrow();
            });
        });
    });

    describe('recordKafkaMessagePublished', () => {
        it('should record Kafka message published', () => {
            const topic = 'incident-alerts';
            const status = 'success';

            expect(() => {
                service.recordKafkaMessagePublished(topic, status);
            }).not.toThrow();
        });
    });

    describe('recordKafkaError', () => {
        it('should record Kafka error', () => {
            const topic = 'incident-alerts';
            const errorType = 'publish_error';

            expect(() => {
                service.recordKafkaError(topic, errorType);
            }).not.toThrow();
        });
    });

    describe('recordCacheHit', () => {
        it('should record cache hit', () => {
            const keyPattern = 'incidents:user1';

            expect(() => {
                service.recordCacheHit(keyPattern);
            }).not.toThrow();
        });
    });

    describe('recordCacheMiss', () => {
        it('should record cache miss', () => {
            const keyPattern = 'incidents:user1';

            expect(() => {
                service.recordCacheMiss(keyPattern);
            }).not.toThrow();
        });
    });
});
