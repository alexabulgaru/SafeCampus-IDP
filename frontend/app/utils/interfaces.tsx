export interface User {
    id: string;
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'OPERATOR' | 'ADMIN' | 'MAINTENANCE';
    lat?: string;
    lng?: string;
    incidents: Incident[];
    createdAt: string;
    updatedAt: string;
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    type: 'SAFETY' | 'MAINTENANCE' | 'MEDICAL' | 'USUAL';
    reportedById: string;
    reportedBy?: {
        email: string;
        firstName: string;
        lastName: string;
    };
    lat?: string;
    lng?: string;
    isResolved: boolean;
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    incidentId: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}
