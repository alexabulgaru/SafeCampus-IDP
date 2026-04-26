import { Injectable } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class KafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private consumer: Consumer;
    private isConnected = false;

    constructor(private metricsService: MetricsService) {
        this.kafka = new Kafka({
            clientId: `${process.env.KAFKA_CLIENT_ID || ''}`,
            brokers: (process.env.KAFKA_BROKERS || '').split(','),
            retry: {
                maxRetryTime: 30000,
                initialRetryTime: 100,
                retries: 8,
            },
        });

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: `${process.env.KAFKA_GROUP_ID || ''}` });

        this.connect();
    }

    async connect() {
        try {
            await this.producer.connect();
            await this.consumer.connect();
            this.isConnected = true;
        } catch (error) {
            console.log('Connection failed:', error);
            this.isConnected = false;
        }
    }

    async publishAlert(topic: string, message: any): Promise<void> {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: message.incidentId || 'default',
                        value: JSON.stringify(message),
                        timestamp: Date.now().toString(),
                    },
                ],
            });

            this.metricsService.recordKafkaMessagePublished(topic, 'success');

        } catch (error) {
            throw error;
        }
    }

    async subscribe(topic: string, callback: (message: any) => Promise<void>) {
        try {
            await this.consumer.subscribe({ topic, fromBeginning: false });
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const parsedMessage = JSON.parse(message.value.toString());
                        await callback(parsedMessage);
                    } catch (error) {
                        console.log('Error processing message:', error);
                    }
                },
            });
        } catch (error) {
            console.log('Subscription error:', error);
        }
    }

    async disconnect() {
        try {
            await this.producer.disconnect();
            await this.consumer.disconnect();
            this.isConnected = false;
        } catch (error) {
            console.log('Disconnect error:', error);
        }
    }
}
