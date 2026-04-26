import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaService } from 'src/kafka/kafka.service';
import { Role, IncidentType } from '@prisma/client';

@Injectable()
export class NotificationService implements OnModuleInit {
    constructor(
        private readonly prisma: PrismaService,
        private readonly kafka: KafkaService,
    ) { }

    async onModuleInit() {
        await this.kafka.subscribe('incident-alerts', this.handleIncidentAlert.bind(this));
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

    async createAndPublishAlert(
        incidentId: string,
        title: string,
        message: string,
        incidentType: string,
        incidentLat: string,
        incidentLng: string,
    ): Promise<void> {
        try {
            const incidentLatNum = parseFloat(incidentLat);
            const incidentLngNum = parseFloat(incidentLng);

            const students = await this.prisma.user.findMany({
                where: {
                    role: Role.STUDENT,
                    lat: { not: null },
                    lng: { not: null },
                },
            });

            const nearbyStudents = students.filter((student) => {
                const studentLat = parseFloat(student.lat);
                const studentLng = parseFloat(student.lng);
                const distance = this.calculateDistance(
                    incidentLatNum,
                    incidentLngNum,
                    studentLat,
                    studentLng,
                );
                return distance <= 1;
            });

            const staff = await this.prisma.user.findMany({
                where: {
                    role: {
                        in: [Role.OPERATOR, Role.MAINTENANCE, Role.ADMIN],
                    },
                },
            });

            const relevantStaff = staff.filter((staffMember) =>
                this.shouldNotifyRole(staffMember.role, incidentType),
            );

            const allRecipients = [...nearbyStudents, ...relevantStaff];

            for (const recipient of allRecipients) {
                const notification = await this.prisma.notification.create({
                    data: {
                        userId: recipient.id,
                        title,
                        message,
                        incidentId,
                    },
                });

                await this.kafka.publishAlert('incident-alerts', {
                    notificationId: notification.id,
                    incidentId,
                    userId: recipient.id,
                    title,
                    message,
                    incidentType,
                    recipientRole: recipient.role,
                    timestamp: new Date().toISOString(),
                });
            }

            console.log(
                `Alert published for incident ${incidentId} (${incidentType}) to ${nearbyStudents.length} nearby students + ${relevantStaff.length} staff`,
            );
        } catch (error) {
            console.log('Error creating alert:', error);
            throw error;
        }
    }

    private async handleIncidentAlert(message: any): Promise<void> {
        try {
            await this.prisma.notification.update({
                where: { id: message.notificationId },
                data: { sentViaKafka: true },
            });
        } catch (error) {
            console.log('Error handling alert:', error);
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
