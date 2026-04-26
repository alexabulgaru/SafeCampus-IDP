import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CacheService } from "../cache/cache.service";
import { NotificationService } from "src/notifications/notifications.service";
import { CreateIncidentDto } from "./dtos/create-incident.dto";
import { Role, IncidentType, Incidents, User } from "@prisma/client";
import { UpdateStatusDto } from "./dtos/update-status.dto";
import { KeycloakUser } from "../common/interfaces/interfaces";

@Injectable()
export class IncidentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: CacheService,
        private readonly notifications: NotificationService,
    ) { }

    async createIncident(createIncidentDto: CreateIncidentDto): Promise<void> {
        try {
            const incident = await this.prisma.incidents.create({
                data: {
                    title: createIncidentDto.title,
                    description: createIncidentDto.description,
                    type: createIncidentDto.type,
                    lat: createIncidentDto.lat,
                    lng: createIncidentDto.lng,
                    reportedById: createIncidentDto.reportedById,
                    isResolved: false,
                },
            });

            await this.notifications.createAndPublishAlert(
                incident.id,
                `New ${incident.type} incident reported`,
                `${createIncidentDto.title}: ${createIncidentDto.description}`,
                incident.type,
                incident.lat,
                incident.lng,
            );

            await this.cache.invalidatePattern('incidents:*');
        } catch (e) {
            console.log('Error creating incident:', e);
            throw e;
        }
    }

    async getIncidents(user: KeycloakUser): Promise<(Incidents & { reportedBy: User | null })[]> {
        try {
            const keycloakId = user?.sub || user?.id;
            const cacheKey = `incidents:${keycloakId}`;

            const cached = await this.cache.get(cacheKey);
            if (cached) {
                console.log('Returning incidents from cache');
                return cached;
            }

            const dbUser = await this.prisma.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                console.log('Database user not found for keycloakId:', keycloakId);
                return [];
            }

            let incidents: any[] = [];

            if (dbUser.role === Role.STUDENT) {
                incidents = await this.prisma.incidents.findMany({
                    where: { reportedById: dbUser.id },
                    include: { reportedBy: true },
                });
            } else if (dbUser.role === Role.MAINTENANCE) {
                incidents = await this.prisma.incidents.findMany({
                    where: {
                        OR: [
                            { reportedById: dbUser.id },
                            { type: IncidentType.MAINTENANCE },
                        ],
                    },
                    include: { reportedBy: true },
                });
            } else if (dbUser.role === Role.OPERATOR) {
                incidents = await this.prisma.incidents.findMany({
                    where: {
                        OR: [
                            { reportedById: dbUser.id },
                            {
                                type: {
                                    in: [IncidentType.SAFETY, IncidentType.MEDICAL, IncidentType.USUAL],
                                },
                            },
                        ],
                    },
                    include: { reportedBy: true },
                });
            } else if (dbUser.role === Role.ADMIN) {
                incidents = await this.prisma.incidents.findMany({
                    include: { reportedBy: true },
                });
            }

            const priorityMap = {
                [IncidentType.SAFETY]: 0,
                [IncidentType.MEDICAL]: 1,
                [IncidentType.MAINTENANCE]: 2,
                [IncidentType.USUAL]: 3,
            };

            incidents.sort((a, b) => priorityMap[a.type] - priorityMap[b.type]);

            await this.cache.set(cacheKey, incidents, 300);

            return incidents;
        } catch (e) {
            console.log('Error getting incidents:', e);
            throw e;
        }
    }

    async updateIncidentStatus(updateStatusDto: UpdateStatusDto, user: KeycloakUser): Promise<void> {
        try {
            const keycloakId = user?.sub || user?.id;
            const dbUser = await this.prisma.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                throw new ForbiddenException('User not found');
            }

            if (dbUser.role === Role.STUDENT) {
                throw new ForbiddenException('Students cannot update incident status');
            }

            await this.prisma.incidents.update({
                where: { id: updateStatusDto.incidentId },
                data: { status: updateStatusDto.status },
            });

            await this.cache.invalidatePattern('incidents:*');
        } catch (e) {
            console.log('Error updating incident status:', e);
            throw e;
        }
    }

    async deleteIncident(incidentId: string, user: KeycloakUser): Promise<void> {
        try {
            const keycloakId = user?.sub || user?.id;
            const dbUser = await this.prisma.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                throw new ForbiddenException('User not found');
            }

            if (dbUser.role !== Role.ADMIN) {
                throw new ForbiddenException('Only admins can delete incidents');
            }

            await this.prisma.incidents.delete({
                where: { id: incidentId },
            });

            await this.cache.invalidatePattern('incidents:*');
        } catch (e) {
            console.log('Error deleting incident:', e);
            throw e;
        }
    }
}
