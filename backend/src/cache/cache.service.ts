import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class CacheService {
    private client: ReturnType<typeof createClient>;
    private isConnected = false;

    constructor(private metricsService: MetricsService) {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.client.on('error', (err) => {
            console.log('Redis Client Error', err);
        });

        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            console.log('Failed to connect to Redis:', error);
            this.isConnected = false;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.client.set(key, serialized, { EX: ttl });
            } else {
                await this.client.set(key, serialized);
            }
        } catch (error) {
            console.log('Redis SET error:', error);
        }
    }

    async get(key: string): Promise<any | null> {
        if (!this.isConnected) {
            return null;
        }

        try {
            const data = await this.client.get(key);
            if (data) {
                this.metricsService.recordCacheHit(key);
                return JSON.parse(typeof data === 'string' ? data : data.toString());
            } else {
                this.metricsService.recordCacheMiss(key);
                return null;
            }
        } catch (error) {
            console.log('Redis GET error:', error);
            return null;
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await this.client.del(key);
        } catch (error) {
            console.log('Redis DEL error:', error);
        }
    }

    async invalidatePattern(pattern: string): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            let cursor = '0';
            let keepScanning = true;

            while (keepScanning) {
                const res = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });

                cursor = res.cursor.toString();

                if (res.keys.length > 0) {
                    await this.client.del(res.keys);
                }

                if (cursor === '0') {
                    keepScanning = false;
                }
            }
        } catch (error) {
            console.log('Redis pattern invalidation error:', error);
        }
    }
}
