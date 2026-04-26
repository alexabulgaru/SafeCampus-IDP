import { Controller, Post, Get, Body, Req, Patch, Delete } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { CreateIncidentDto } from "./dtos/create-incident.dto";
import { UpdateStatusDto } from "./dtos/update-status.dto";
import { KeycloakUser } from "../common/interfaces/interfaces";

@Controller('incidents')
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post('create')
    async createIncident(@Body() createIncidentDto: CreateIncidentDto) {
        await this.incidentsService.createIncident(createIncidentDto);
    }

    @Get()
    async getIncidents(@Req() request: Request & { user: KeycloakUser }) {
        return await this.incidentsService.getIncidents(request.user);
    }

    @Patch('update-status')
    async updateIncidentStatus(@Body() updateStatusDto: UpdateStatusDto, @Req() request: Request & { user: KeycloakUser }) {
        await this.incidentsService.updateIncidentStatus(updateStatusDto, request.user);
    }

    @Delete('delete')
    async deleteIncident(@Body('incidentId') incidentId: string, @Req() request: Request & { user: KeycloakUser }) {
        await this.incidentsService.deleteIncident(incidentId, request.user);
    }
}
