import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from 'src/kafka/kafka.service';
import { Role, IncidentType, Incidents, User } from '@prisma/client';

@Injectable()
export class NotificationService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly kafka: KafkaService,
    ) { }

    async onModuleInit() {
        await this.kafka.subscribe('incident-created', this.handleNewIncident.bind(this));
    }

    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private shouldNotifyRole(role: Role, incidentType: string): boolean {
        if (role === Role.ADMIN) {
            return true;
        }
        if (role === Role.MAINTENANCE) {
            return incidentType === IncidentType.MAINTENANCE;
        }
        if (role === Role.OPERATOR) {
            return incidentType === IncidentType.SAFETY ||
                incidentType === IncidentType.MEDICAL ||
                incidentType === IncidentType.USUAL;
        }
        return false;
    }

    private async handleNewIncident(incident: Incidents): Promise<void> {
        try {
            const incidentLatNum = parseFloat(incident.lat);
            const incidentLngNum = parseFloat(incident.lng);
            const title = `New ${incident.type} incident reported`;
            const message = `${incident.title}: ${incident.description}`;

            const students: User[] = await this.prisma.user.findMany({
                where: {
                    role: Role.STUDENT,
                    lat: { not: null },
                    lng: { not: null },
                },
            });

            const nearbyStudents = students.filter((student) => {
                if (!student.lat || !student.lng) return false;

                const studentLat = parseFloat(student.lat);
                const studentLng = parseFloat(student.lng);
                const distance = this.calculateDistance(incidentLatNum, incidentLngNum, studentLat, studentLng);

                return distance <= 1;
            });

            const staff: User[] = await this.prisma.user.findMany({
                where: {
                    role: { in: [Role.OPERATOR, Role.MAINTENANCE, Role.ADMIN] },
                },
            });

            const relevantStaff = staff.filter((staffMember) =>
                this.shouldNotifyRole(staffMember.role, incident.type),
            );

            const allRecipients: User[] = [...nearbyStudents, ...relevantStaff];

            for (const recipient of allRecipients) {
                const notification = await this.prisma.notification.create({
                    data: {
                        userId: recipient.id,
                        title,
                        message,
                        incidentId: incident.id,
                    },
                });

                await this.kafka.publishAlert('incident-alerts', {
                    notificationId: notification.id,
                    incidentId: incident.id,
                    userId: recipient.id,
                    title,
                    message,
                    incidentType: incident.type,
                    recipientRole: recipient.role,
                    timestamp: new Date().toISOString(),
                });
            }

            console.log(`[Kafka Consumer] Successfully notified ${nearbyStudents.length} students and ${relevantStaff.length} staff.`);

        } catch (error) {
            console.log('[Kafka Consumer] Error handling new incident alert:', error);
        }
    }

    async getNotifications(userId: string, unreadOnly: boolean = false) {
        try {
            const notifications = await this.prisma.notification.findMany({
                where: {
                    userId,
                    ...(unreadOnly && { isRead: false }),
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            return notifications;
        } catch (error) {
            console.log('Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId: string): Promise<void> {
        try {
            await this.prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true, updatedAt: new Date() },
            });
        } catch (error) {
            console.log('Error marking as read:', error);
            throw error;
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        try {
            await this.prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true, updatedAt: new Date() },
            });
        } catch (error) {
            console.log('Error marking all as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId: string): Promise<void> {
        try {
            await this.prisma.notification.delete({
                where: { id: notificationId },
            });
        } catch (error) {
            console.log('Error deleting notification:', error);
            throw error;
        }
    }
}
