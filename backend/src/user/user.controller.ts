import { Controller, Body, Post, Get, Delete, Patch, Req, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserLocationDto } from './dtos/update-user-location.dto';
import { KeycloakUser } from '../common/interfaces/interfaces';
import { Role } from '@prisma/client';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('update-location')
    async updateLocation(@Body() updateUserLocationDto: UpdateUserLocationDto) {
        await this.userService.updateUserLocation(updateUserLocationDto);
    }

    @Get('by-keycloak-id/:keycloakId')
    async getUserByKeycloakId(@Body('keycloakId') keycloakId: string) {
        return this.userService.getUserByKeycloakId(keycloakId);
    }

    @Get('all')
    async getAllUsers(@Req() request: Request & { user: KeycloakUser }) {
        return this.userService.getAllUsers(request.user);
    }

    @Delete('delete/:userId')
    async deleteUser(@Param('userId') userId: string, @Req() request: Request & { user: KeycloakUser }) {
        await this.userService.deleteUser(userId, request.user);
    }

    @Patch('update-role/:userId')
    async updateUserRole(
        @Param('userId') userId: string,
        @Body('newRole') newRole: Role,
        @Req() request: Request & { user: KeycloakUser }
    ) {
        await this.userService.updateUserRole(userId, newRole, request.user);
    }
};
