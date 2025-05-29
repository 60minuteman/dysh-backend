import { IsString, IsNotEmpty, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleUserNameDto {
  @ApiPropertyOptional({
    description: 'User first name from Apple',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name from Apple',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class AppleAuthDto {
  @ApiProperty({
    description: 'Apple ID token received from iOS app',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiPropertyOptional({
    description: 'User email from Apple (only provided on first sign in)',
    example: 'user@privaterelay.appleid.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User full name from Apple (only provided on first sign in) - DEPRECATED: Use name object instead',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User name object from Apple (only provided on first sign in)',
    type: AppleUserNameDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppleUserNameDto)
  name?: AppleUserNameDto;
} 