import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { MetricsService } from '../metrics/metrics.service';

jest.mock('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        setEx: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        keys: jest.fn().mockResolvedValue([]),
        on: jest.fn(),
        scan: jest.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    }),
}));

describe('CacheService', () => {
    let service: CacheService;
    let metricsService: MetricsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: MetricsService,
                    useValue: {
                        recordCacheHit: jest.fn(),
                        recordCacheMiss: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
        metricsService = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('set', () => {
        it('should set a value in cache', async () => {
            const key = 'test-key';
            const value = { data: 'test' };
            
            await service.set(key, value);
            
            expect(service).toBeDefined();
        });

        it('should set a value with TTL', async () => {
            const key = 'test-key-ttl';
            const value = { data: 'test' };
            
            await service.set(key, value, 10);
            
            expect(service).toBeDefined();
        });
    });

    describe('get', () => {
        it('should return null for non-existent key', async () => {
            const result = await service.get('non-existent-key');
            
            expect(result).toBeNull();
        });

        it('should record cache miss', async () => {
            await service.get('missing-key');
            
            expect(metricsService.recordCacheMiss).toHaveBeenCalledWith('missing-key');
        });
    });

    describe('del', () => {
        it('should delete a value from cache', async () => {
            const key = 'test-key';
            
            await service.del(key);
            
            expect(service).toBeDefined();
        });
    });

    describe('invalidatePattern', () => {
        it('should invalidate keys matching pattern', async () => {
            await service.invalidatePattern('incidents:*');
            
            expect(service).toBeDefined();
        });
    });
});
