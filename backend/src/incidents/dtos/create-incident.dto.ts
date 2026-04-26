import {
    IsNotEmpty,
    IsString,
    IsBoolean,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { IncidentType } from '@prisma/client';

export class CreateIncidentDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsEnum(IncidentType)
    type: IncidentType;

    @IsNotEmpty()
    @IsString()
    reportedById: string;

    @IsOptional()
    @IsString()
    lat?: string;

    @IsOptional()
    @IsString()
    lng?: string;

    @IsOptional()
    @IsBoolean()
    isResolved?: boolean;
}
