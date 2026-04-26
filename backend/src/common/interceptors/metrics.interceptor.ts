import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
    constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, path } = request;
        const startTime = Date.now();

        return next.handle().pipe(
            tap(
                () => {
                    const response = context.switchToHttp().getResponse();
                    const statusCode = response.statusCode || 200;
                    const duration = (Date.now() - startTime) / 1000;
                    this.metrics.recordHttpRequest(method, path, statusCode, duration);
                },
                (error) => {
                    const statusCode = error.status || 500;
                    const duration = (Date.now() - startTime) / 1000;
                    this.metrics.recordHttpRequest(method, path, statusCode, duration);
                },
            ),
        );
    }
}
