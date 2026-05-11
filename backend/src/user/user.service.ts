import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaReplicaService } from '../prisma/prisma-replica.service';
import { KeycloakUserSyncData } from '../common/interfaces/interfaces';
import { UpdateUserLocationDto } from './dtos/update-user-location.dto';
import { KeycloakUser } from '../common/interfaces/interfaces';
import { Role } from '@prisma/client';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly prismaReplica: PrismaReplicaService,
    ) { }

    async upsertUserFromKeycloak(data: KeycloakUserSyncData): Promise<void> {
        try {
            await this.prisma.user.upsert({
                where: {
                    keycloakId: data.keycloakId
                },
                update: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                },
                create: {
                    keycloakId: data.keycloakId,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                },
            });
        } catch (e) {
            console.log('Error upserting user from Keycloak:', e);
        }
    }

    async updateUserLocation(updateUserLocationDto: UpdateUserLocationDto): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: updateUserLocationDto.userId },
                data: { lat: updateUserLocationDto.lat, lng: updateUserLocationDto.lng },
            });
        } catch (e) {
            console.log('Error updating user location:', e);
            throw e;
        }
    }

    async getUserByKeycloakId(keycloakId: string) {
        return this.prismaReplica.user.findUnique({
            where: { keycloakId },
        });
    }

    async getAllUsers(user: KeycloakUser): Promise<User[]> {
        try {
            const keycloakId = user?.sub || user?.id;

            const dbUser = await this.prismaReplica.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                console.log('Database user not found for keycloakId:', keycloakId);
                return [];
            }

            if (dbUser.role !== 'ADMIN') {
                throw new ForbiddenException('Only admins can view all users');
            }

            return await this.prismaReplica.user.findMany({
                include: {
                    incidents: true,
                },
            });
        } catch (e) {
            console.log('Error getting all users:', e);
            throw e;
        }
    }

    async deleteUser(userId: string, user: KeycloakUser): Promise<void> {
        try {
            const keycloakId = user?.sub || user?.id;
            const dbUser = await this.prisma.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                throw new ForbiddenException('User not found');
            }

            if (dbUser.role !== 'ADMIN') {
                throw new ForbiddenException('Only admins can delete users');
            }

            await this.prisma.incidents.deleteMany({
                where: { reportedById: userId },
            });

            await this.prisma.user.delete({
                where: { id: userId },
            });
        } catch (e) {
            console.log('Error deleting user:', e);
            throw e;
        }
    }

    async updateUserRole(userId: string, newRole: Role, user: KeycloakUser): Promise<void> {
        try {
            const keycloakId = user?.sub || user?.id;
            const dbUser = await this.prisma.user.findUnique({
                where: { keycloakId },
            });

            if (!dbUser) {
                throw new ForbiddenException('User not found');
            }

            if (dbUser.role !== 'ADMIN') {
                throw new ForbiddenException('Only admins can update user roles');
            }

            await this.prisma.user.update({
                where: { id: userId },
                data: { role: newRole },
            });
        } catch (e) {
            console.log('Error updating user role:', e);
            throw e;
        }
    }
}
