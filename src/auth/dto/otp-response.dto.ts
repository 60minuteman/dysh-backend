import { ApiProperty } from '@nestjs/swagger';

export class OtpResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether user exists (for new users, this will be false)',
    example: false,
  })
  userExists: boolean;
}

export class OtpVerificationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether user exists (if false, user needs to provide name)',
    example: false,
  })
  userExists: boolean;

  @ApiProperty({
    description: 'Temporary verification token for account creation (only if user does not exist)',
    example: 'temp_verification_token_123',
    required: false,
  })
  tempToken?: string;
}
