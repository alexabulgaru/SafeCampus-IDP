import { Controller, Get, Post, Param, Request } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { KeycloakUser } from '../common/interfaces/interfaces';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    async getNotifications(@Request() req) {
        const user = req.user as KeycloakUser;
        const dbUser = await this.prisma.user.findUnique({
            where: { keycloakId: user.sub || user.id },
        });
        return this.notificationService.getNotifications(dbUser.id);
    }

    @Get('unread')
    async getUnreadNotifications(@Request() req) {
        const user = req.user as KeycloakUser;
        const dbUser = await this.prisma.user.findUnique({
            where: { keycloakId: user.sub || user.id },
        });
        return this.notificationService.getNotifications(dbUser.id, true);
    }

    @Post(':id/read')
    async markAsRead(@Param('id') notificationId: string) {
        await this.notificationService.markAsRead(notificationId);
        return { message: 'Marked as read' };
    }

    @Post('mark-all-read')
    async markAllAsRead(@Request() req) {
        const user = req.user as KeycloakUser;
        const dbUser = await this.prisma.user.findUnique({
            where: { keycloakId: user.sub || user.id },
        });
        await this.notificationService.markAllAsRead(dbUser.id);
        return { message: 'All notifications marked as read' };
    }

    @Post(':id/delete')
    async deleteNotification(@Param('id') notificationId: string) {
        await this.notificationService.deleteNotification(notificationId);
        return { message: 'Notification deleted' };
    }
}
