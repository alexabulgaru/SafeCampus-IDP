import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class UpdateUserLocationDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    lat: string;

    @IsNotEmpty()
    @IsString()
    lng: string;
}
