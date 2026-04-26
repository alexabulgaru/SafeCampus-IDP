import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
    private httpRequestDuration: Histogram;
    private httpRequestTotal: Counter;
    private incidentsCreated: Counter;
    private notificationsCreated: Counter;
    private kafkaMessagesPublished: Counter;
    private kafkaErrors: Counter;
    private cacheHits: Counter;
    private cacheMisses: Counter;

    constructor() {
        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'HTTP request latency in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5],
        });

        this.httpRequestTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
        });

        this.incidentsCreated = new Counter({
            name: 'incidents_created_total',
            help: 'Total incidents created',
            labelNames: ['type', 'status'],
        });

        this.notificationsCreated = new Counter({
            name: 'notifications_created_total',
            help: 'Total notifications created',
            labelNames: ['role', 'type'],
        });

        this.kafkaMessagesPublished = new Counter({
            name: 'kafka_messages_published_total',
            help: 'Total Kafka messages published',
            labelNames: ['topic', 'status'],
        });

        this.kafkaErrors = new Counter({
            name: 'kafka_errors_total',
            help: 'Total Kafka errors',
            labelNames: ['topic', 'error_type'],
        });

        this.cacheHits = new Counter({
            name: 'cache_hits_total',
            help: 'Total cache hits',
            labelNames: ['key_pattern'],
        });

        this.cacheMisses = new Counter({
            name: 'cache_misses_total',
            help: 'Total cache misses',
            labelNames: ['key_pattern'],
        });
    }

    recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
        this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
        this.httpRequestTotal.labels(method, route, statusCode.toString()).inc();
    }

    recordIncidentCreated(type: string, status: string) {
        this.incidentsCreated.labels(type, status).inc();
    }

    recordNotificationCreated(role: string, type: string) {
        this.notificationsCreated.labels(role, type).inc();
    }

    recordKafkaMessagePublished(topic: string, status: string) {
        this.kafkaMessagesPublished.labels(topic, status).inc();
    }

    recordKafkaError(topic: string, errorType: string) {
        this.kafkaErrors.labels(topic, errorType).inc();
    }

    recordCacheHit(keyPattern: string) {
        this.cacheHits.labels(keyPattern).inc();
    }

    recordCacheMiss(keyPattern: string) {
        this.cacheMisses.labels(keyPattern).inc();
    }
}
