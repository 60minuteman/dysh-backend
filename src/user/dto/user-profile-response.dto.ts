import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ 
    example: true, 
    description: 'User subscription status' 
  })
  isPro: boolean;

  @ApiProperty({ 
    example: 'user123', 
    description: 'User ID' 
  })
  userId: string;

  @ApiProperty({ 
    example: 'john@example.com', 
    description: 'User email',
    required: false 
  })
  email?: string;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'User full name',
    required: false 
  })
  fullName?: string;
} 