import { Role } from '@prisma/client';

export interface KeycloakUserSyncData {
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
}

export interface KeycloakUser {
    sub?: string;
    id?: string;
}
