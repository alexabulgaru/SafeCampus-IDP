import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { NotificationService } from '../notifications/notifications.service';
import { MetricsService } from '../metrics/metrics.service';
import { IncidentType, Role, Status } from '@prisma/client';
import { KafkaService } from '../kafka/kafka.service';

describe('IncidentsService', () => {
    let service: IncidentsService;
    let prismaService: PrismaService;
    let cacheService: CacheService;
    let notificationService: NotificationService;
    let metricsService: MetricsService;

    const mockIncident = {
        id: '1',
        title: 'Test Incident',
        description: 'Test Description',
        type: IncidentType.USUAL,
        lat: '40.7128',
        lng: '-74.006',
        reportedById: 'user1',
        isResolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IncidentsService,
                {
                    provide: PrismaService,
                    useValue: {
                        incidents: {
                            create: jest.fn().mockResolvedValue(mockIncident),
                            findMany: jest.fn().mockResolvedValue([mockIncident]),
                            findUnique: jest.fn().mockResolvedValue(mockIncident),
                            update: jest.fn().mockResolvedValue(mockIncident),
                            delete: jest.fn().mockResolvedValue(mockIncident),
                        },
                        user: {
                            findUnique: jest.fn().mockResolvedValue({
                                id: 'user1',
                                keycloakId: 'keycloak1',
                                role: Role.ADMIN,
                            }),
                        },
                    },
                },
                {
                    provide: CacheService,
                    useValue: {
                        get: jest.fn().mockResolvedValue(null),
                        set: jest.fn(),
                        invalidatePattern: jest.fn(),
                    },
                },
                {
                    provide: NotificationService,
                    useValue: {
                        createAndPublishAlert: jest.fn(),
                    },
                },
                {
                    provide: MetricsService,
                    useValue: {
                        recordIncidentCreated: jest.fn(),
                    },
                },
                {
                    provide: KafkaService,
                    useValue: {
                        publishAlert: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<IncidentsService>(IncidentsService);
        prismaService = module.get<PrismaService>(PrismaService);
        cacheService = module.get<CacheService>(CacheService);
        notificationService = module.get<NotificationService>(NotificationService);
        metricsService = module.get<MetricsService>(MetricsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createIncident', () => {
        it('should create an incident', async () => {
            const createDto = {
                title: 'Test Incident',
                description: 'Test Description',
                type: IncidentType.USUAL,
                lat: '40.7128',
                lng: '-74.006',
                reportedById: 'user1',
            };

            await service.createIncident(createDto);

            expect(prismaService.incidents.create).toHaveBeenCalledWith({
                data: {
                    title: createDto.title,
                    description: createDto.description,
                    type: createDto.type,
                    lat: createDto.lat,
                    lng: createDto.lng,
                    reportedById: createDto.reportedById,
                    isResolved: false,
                },
            });

            expect(metricsService.recordIncidentCreated).toHaveBeenCalled();
            expect(cacheService.invalidatePattern).toHaveBeenCalledWith('incidents:*');
        });
    });

    describe('getIncidents', () => {
        it('should return incidents for admin user', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };

            const result = await service.getIncidents(user);

            expect(result).toEqual([mockIncident]);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { keycloakId: user.sub },
            });
        });

        it('should return cached incidents if available', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };
            const cachedIncidents = [mockIncident];
            
            jest.spyOn(cacheService, 'get').mockResolvedValue(cachedIncidents);

            const result = await service.getIncidents(user);

            expect(result).toEqual(cachedIncidents);
        });

        it('should return empty array if user not found', async () => {
            const user = { sub: 'unknown', id: 'unknown' };
            
            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            const result = await service.getIncidents(user);

            expect(result).toEqual([]);
        });
    });

    describe('updateIncidentStatus', () => {
        it('should update incident status', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };
            const updateDto = { incidentId: '1', status: Status.RESOLVED };

            await service.updateIncidentStatus(updateDto, user);

            expect(prismaService.incidents.update).toHaveBeenCalledWith({
                where: { id: updateDto.incidentId },
                data: { status: updateDto.status },
            });
            expect(cacheService.invalidatePattern).toHaveBeenCalledWith('incidents:*');
        });
    });

    describe('deleteIncident', () => {
        it('should delete an incident', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };
            const incidentId = '1';

            await service.deleteIncident(incidentId, user);

            expect(prismaService.incidents.delete).toHaveBeenCalledWith({
                where: { id: incidentId },
            });
            expect(cacheService.invalidatePattern).toHaveBeenCalledWith('incidents:*');
        });
    });
});
