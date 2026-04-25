import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

	@Get('me')
	async me(@Req() req: Request) {
		return await this.authService.getMe(req);
	}
}
