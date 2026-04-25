import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from 'src/user/user.service';
import { Role } from '@prisma/client';

@Injectable()
export class KeycloakSyncInterceptor implements NestInterceptor {
    constructor(private readonly userService: UserService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();
        const tokenContent = req.user as any;

        if (!tokenContent || !tokenContent.sub) {
            return next.handle();
        }

        const { keycloakId, email, firstName, lastName, role } = this.extractAndNormalize(tokenContent);

        await this.userService.upsertUserFromKeycloak({
            keycloakId,
            email,
            firstName,
            lastName,
            role,
        });

        req.user = {
            id: keycloakId,
            keycloakId,
            email,
            firstName,
            lastName,
            role,
            raw: tokenContent,
        };

        return next.handle();
    }

    private extractAndNormalize(tokenContent: any): { keycloakId: string, email: string, firstName: string, lastName: string, role: Role } {
        const keycloakId: string = tokenContent.sub;
        const email: string = tokenContent.email;
        const name: string = tokenContent.name ?? tokenContent.preferred_username ?? '';

        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        const realmRoles: string[] = tokenContent?.realm_access?.roles ?? [];

        const roleFromKeycloak = realmRoles.find(r =>
            Object.values(Role).includes(r.toUpperCase() as Role)
        );

        const normalizedRole: Role = (
            roleFromKeycloak ? roleFromKeycloak.toUpperCase() : 'STUDENT'
        ) as Role;

        if (!keycloakId || !email) {
            console.log('Keycloak token is missing required user information.');
        }

        return {
            keycloakId,
            email,
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            role: normalizedRole,
        };
    }
}
