import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'Home', description: 'User-friendly name for the location' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Nigeria', description: 'Full country name' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'NG', description: 'ISO country code' })
  @IsString()
  countryCode: string;

  @ApiProperty({ example: 'Africa/Lagos', description: 'IANA timezone identifier' })
  @IsString()
  timezone: string;

  @ApiProperty({ example: 6.5244, description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 3.3792, description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: true, description: 'Whether this is the primary location', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: 'Work', description: 'User-friendly name for the location', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: false, description: 'Whether this location is active for recipe generation', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: true, description: 'Whether this is the primary location', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class LocationResponseDto {
  @ApiProperty({ example: 'cuid123', description: 'Location ID' })
  id: string;

  @ApiProperty({ example: 'Home', description: 'Location name' })
  name: string;

  @ApiProperty({ example: 'Nigeria', description: 'Country name' })
  country: string;

  @ApiProperty({ example: 'NG', description: 'Country code' })
  countryCode: string;

  @ApiProperty({ example: 'Africa/Lagos', description: 'Timezone' })
  timezone: string;

  @ApiProperty({ example: 6.5244, description: 'Latitude', required: false })
  latitude?: number;

  @ApiProperty({ example: 3.3792, description: 'Longitude', required: false })
  longitude?: number;

  @ApiProperty({ example: true, description: 'Is primary location' })
  isPrimary: boolean;

  @ApiProperty({ example: true, description: 'Is active for recipe generation' })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-06T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
} 