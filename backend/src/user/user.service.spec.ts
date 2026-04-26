import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('UserService', () => {
    let service: UserService;
    let prismaService: PrismaService;

    const mockUser = {
        id: 'user1',
        keycloakId: 'keycloak1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.ADMIN,
        lat: "40.7128",
        lng: "-74.006",
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            upsert: jest.fn().mockResolvedValue(mockUser),
                            update: jest.fn().mockResolvedValue(mockUser),
                            findUnique: jest.fn().mockResolvedValue(mockUser),
                            findMany: jest.fn().mockResolvedValue([mockUser]),
                            delete: jest.fn().mockResolvedValue(mockUser),
                        },
                        incidents: {
                            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('upsertUserFromKeycloak', () => {
        it('should upsert user from Keycloak data', async () => {
            const keycloakData = {
                keycloakId: 'keycloak1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: Role.STUDENT,
            };

            await service.upsertUserFromKeycloak(keycloakData);

            expect(prismaService.user.upsert).toHaveBeenCalledWith({
                where: { keycloakId: keycloakData.keycloakId },
                update: {
                    email: keycloakData.email,
                    firstName: keycloakData.firstName,
                    lastName: keycloakData.lastName,
                    role: keycloakData.role,
                },
                create: {
                    keycloakId: keycloakData.keycloakId,
                    email: keycloakData.email,
                    firstName: keycloakData.firstName,
                    lastName: keycloakData.lastName,
                    role: keycloakData.role,
                },
            });
        });
    });

    describe('updateUserLocation', () => {
        it('should update user location', async () => {
            const updateDto = {
                userId: 'user1',
                lat: '40.7128',
                lng: '-74.006',
            };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue({
                ...mockUser,
                lat: 40.7128,
                lng: -74.006,
            });

            await service.updateUserLocation(updateDto);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: updateDto.userId },
                data: { lat: '40.7128', lng: '-74.006' },
            });
        });
    });

    describe('getUserByKeycloakId', () => {
        it('should return user by Keycloak ID', async () => {
            const keycloakId = 'keycloak1';

            const result = await service.getUserByKeycloakId(keycloakId);

            expect(result).toEqual(mockUser);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: { keycloakId },
            });
        });
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

            const result = await service.getAllUsers(user);

            expect(result).toEqual([mockUser]);
            expect(prismaService.user.findMany).toHaveBeenCalled();
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };
            const userId = 'user2';

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

            await service.deleteUser(userId, user);

            expect(prismaService.user.delete).toHaveBeenCalledWith({
                where: { id: userId },
            });
        });
    });

    describe('updateUserRole', () => {
        it('should update user role', async () => {
            const user = { sub: 'keycloak1', id: 'user1' };
            const userId = 'user2';
            const newRole = Role.ADMIN;

            (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prismaService.user.update as jest.Mock).mockResolvedValue({
                ...mockUser,
                role: newRole,
            });

            await service.updateUserRole(userId, newRole, user);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { role: newRole },
            });
        });
    });
});
