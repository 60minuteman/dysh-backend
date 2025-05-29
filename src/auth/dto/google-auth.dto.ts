import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token received from Android app',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
} 