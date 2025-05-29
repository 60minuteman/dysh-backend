import { 
  Controller, 
  Post, 
  Body, 
  HttpStatus, 
  HttpCode,
  ValidationPipe,
  UsePipes,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { OnboardUserDto } from './dto/onboard-user.dto';
import { 
  OnboardingSuccessResponseDto, 
  ValidationErrorDto, 
  ConflictErrorDto 
} from './dto/onboard-response.dto';

@ApiTags('user')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('onboard')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  @ApiOperation({
    summary: 'Complete user onboarding',
    description: 'Submit all user onboarding preferences including dietary choices, ingredients, location, and device information. This endpoint normalizes ingredients and validates all input data. Requires authentication.',
  })
  @ApiBody({
    type: OnboardUserDto,
    description: 'User onboarding data',
    examples: {
      complete: {
        summary: 'Complete onboarding data',
        description: 'Example with all optional fields included',
        value: {
          dietary_preference: 'vegetarian',
          location: {
            latitude: 6.5244,
            longitude: 3.3792,
            region: 'Lagos, Nigeria',
            country: 'Nigeria',
            country_code: 'NG',
            permission_granted: true,
          },
          ingredients: ['tomato', 'onion', 'pepper', 'rice', 'beans'],
          preferred_servings: 4,
          subscription_plan: 'monthly',
          onboarding_version: '1.0',
          device_info: {
            platform: 'ios',
            app_version: '1.0.0',
            device_id: 'device123',
          },
        },
      },
      minimal: {
        summary: 'Minimal required data',
        description: 'Example with only required fields',
        value: {
          dietary_preference: 'none',
          location: {
            permission_granted: false,
          },
          ingredients: ['chicken', 'rice', 'vegetables', 'spices'],
          preferred_servings: 2,
          onboarding_version: '1.0',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Onboarding completed successfully',
    type: OnboardingSuccessResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error or duplicate ingredients',
    type: ValidationErrorDto,
  })
  @ApiConflictResponse({
    description: 'User has already completed onboarding',
    type: ConflictErrorDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async onboardUser(@Body() onboardUserDto: OnboardUserDto, @Request() req: any) {
    // Get user ID from JWT token
    const userId = req.user.id;
    
    return this.userService.onboardUser(userId, onboardUserDto);
  }

  @Get('profile/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve user profile information including onboarding data, location, and device information. User can only access their own profile.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'clp123abc456def789',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clp123abc456def789' },
        userId: { type: 'string', example: 'usr123abc456def789' },
        dietaryPreference: { type: 'string', example: 'VEGETARIAN' },
        ingredients: { type: 'array', items: { type: 'string' }, example: ['tomato', 'onion'] },
        preferredServings: { type: 'number', example: 4 },
        isOnboardingComplete: { type: 'boolean', example: true },
        location: {
          type: 'object',
          properties: {
            latitude: { type: 'number', example: 6.5244 },
            longitude: { type: 'number', example: 3.3792 },
            region: { type: 'string', example: 'Lagos, Nigeria' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getUserProfile(@Param('userId') userId: string, @Request() req: any) {
    // Users can only access their own profile
    if (req.user.id !== userId) {
      throw new Error('Forbidden: You can only access your own profile');
    }
    
    return this.userService.getUserProfile(userId);
  }
} 