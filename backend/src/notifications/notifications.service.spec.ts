import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { MetricsService } from '../metrics/metrics.service';
import { Role, IncidentType } from '@prisma/client';

describe('NotificationService', () => {
    let service: NotificationService;
    let prismaService: PrismaService;
    let kafkaService: KafkaService;
    let metricsService: MetricsService;

    const mockNotification = {
        id: '1',
        userId: 'user1',
        title: 'Test Notification',
        message: 'Test Message',
        incidentId: '1',
        isRead: false,
        sentViaKafka: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockUser = {
        id: 'user1',
        keycloakId: 'keycloak1',
        role: Role.STUDENT,
        lat: '40.7128',
        lng: '-74.006',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findMany: jest.fn().mockResolvedValue([mockUser]),
                            findUnique: jest.fn().mockResolvedValue(mockUser),
                        },
                        notification: {
                            create: jest.fn().mockResolvedValue(mockNotification),
                            findMany: jest.fn().mockResolvedValue([mockNotification]),
                            update: jest.fn().mockResolvedValue(mockNotification),
                            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                            delete: jest.fn().mockResolvedValue(mockNotification),
                        },
                    },
                },
                {
                    provide: KafkaService,
                    useValue: {
                        publishAlert: jest.fn(),
                        subscribe: jest.fn(),
                    },
                },
                {
                    provide: MetricsService,
                    useValue: {
                        recordNotificationCreated: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        prismaService = module.get<PrismaService>(PrismaService);
        kafkaService = module.get<KafkaService>(KafkaService);
        metricsService = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('handleNewIncident', () => {
        it('should create and publish notifications', async () => {
            const mockIncident: any = {
                id: '1',
                title: 'New Incident',
                description: 'Test incident message',
                type: IncidentType.SAFETY,
                lat: '40.7128',
                lng: '-74.006',
            };

            await service.handleNewIncident(mockIncident);

            expect(prismaService.user.findMany).toHaveBeenCalled();
            expect(prismaService.notification.create).toHaveBeenCalled();
            expect(kafkaService.publishAlert).toHaveBeenCalled();
        });
    });

    describe('getNotifications', () => {
        it('should return all notifications for a user', async () => {
            const userId = 'user1';

            const result = await service.getNotifications(userId, false);

            expect(result).toEqual([mockNotification]);
            expect(prismaService.notification.findMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
        });

        it('should return only unread notifications', async () => {
            const userId = 'user1';

            await service.getNotifications(userId, true);

            expect(prismaService.notification.findMany).toHaveBeenCalledWith({
                where: { userId, isRead: false },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const notificationId = '1';

            await service.markAsRead(notificationId);

            expect(prismaService.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: { isRead: true, updatedAt: expect.any(Date) },
            });
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read for a user', async () => {
            const userId = 'user1';

            await service.markAllAsRead(userId);

            expect(prismaService.notification.updateMany).toHaveBeenCalledWith({
                where: { userId, isRead: false },
                data: { isRead: true, updatedAt: expect.any(Date) },
            });
        });
    });
});
