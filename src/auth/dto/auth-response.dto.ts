import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({
    description: 'JWT access token for API requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

export class AuthUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clp123abc456def789',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User full name (if available)',
    example: 'John Doe',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'User first name (if available)',
    example: 'John',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name (if available)',
    example: 'Doe',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Whether user has completed onboarding',
    example: false,
  })
  hasCompletedOnboarding: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  lastLoginAt: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Authentication tokens',
    type: AuthTokensDto,
  })
  tokens: AuthTokensDto;

  @ApiProperty({
    description: 'User information',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
} 