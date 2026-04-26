import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
	constructor(private readonly prisma: PrismaService) { }

	async getMe(request: any) {
		const keycloakUser = request?.user;

		if (!keycloakUser) {
			return null;
		}

		const keycloakId = keycloakUser.sub || keycloakUser.keycloakId;

		if (!keycloakId) {
			return keycloakUser;
		}

		const dbUser = await this.prisma.user.findUnique({
			where: { keycloakId },
		});

		return dbUser || keycloakUser;
	}
}
