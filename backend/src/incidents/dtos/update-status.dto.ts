import {
    IsString,
    IsNotEmpty,
} from "class-validator";
import { Status } from "@prisma/client";

export class UpdateStatusDto {
    @IsNotEmpty()
    @IsString()
    incidentId: string;

    @IsNotEmpty()
    @IsString()
    status: Status;
}
