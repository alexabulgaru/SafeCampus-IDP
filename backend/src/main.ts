import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { register, collectDefaultMetrics } from 'prom-client';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use('/metrics', async (req: any, res: any) => {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  });

  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  app.enableCors({ origin: true });
  collectDefaultMetrics();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
