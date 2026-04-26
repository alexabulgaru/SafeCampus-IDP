import { Test, TestingModule } from '@nestjs/testing';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from '../../metrics/metrics.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('MetricsInterceptor', () => {
    let interceptor: MetricsInterceptor;
    let metricsService: MetricsService;

    const mockRequest = {
        method: 'GET',
        path: '/incidents',
    };

    const mockResponse = {
        statusCode: 200,
    };

    const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: [] })),
    } as unknown as CallHandler;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetricsInterceptor,
                {
                    provide: MetricsService,
                    useValue: {
                    recordHttpRequest: jest.fn(),
                },
            },
        ],
        }).compile();

        interceptor = module.get<MetricsInterceptor>(MetricsInterceptor);
        metricsService = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    describe('intercept', () => {
        it('should record metrics for successful request', (done) => {
            const observable = interceptor.intercept(mockContext, mockCallHandler);

            observable.subscribe(() => {
                expect(metricsService.recordHttpRequest).toHaveBeenCalledWith(
                    mockRequest.method,
                    mockRequest.path,
                    mockResponse.statusCode,
                    expect.any(Number),
                );
                done();
            });
        });

        it('should record metrics with correct method', (done) => {
            const observable = interceptor.intercept(mockContext, mockCallHandler);

            observable.subscribe(() => {
                const calls = (metricsService.recordHttpRequest as jest.Mock).mock.calls;
                expect(calls[0][0]).toBe('GET');
                done();
            });
        });

        it('should record metrics with correct route', (done) => {
            const observable = interceptor.intercept(mockContext, mockCallHandler);

            observable.subscribe(() => {
                const calls = (metricsService.recordHttpRequest as jest.Mock).mock.calls;
                expect(calls[0][1]).toBe('/incidents');
                done();
            });
        });

        it('should record metrics with correct status code', (done) => {
            const observable = interceptor.intercept(mockContext, mockCallHandler);

            observable.subscribe(() => {
                const calls = (metricsService.recordHttpRequest as jest.Mock).mock.calls;
                expect(calls[0][2]).toBe(200);
                done();
            });
        }); 
        
        it('should record duration as a number', (done) => {
            const observable = interceptor.intercept(mockContext, mockCallHandler);

            observable.subscribe(() => {
                const calls = (metricsService.recordHttpRequest as jest.Mock).mock.calls;
                expect(typeof calls[0][3]).toBe('number');
                expect(calls[0][3]).toBeGreaterThanOrEqual(0);
                done();
            });
        });
    });
});
