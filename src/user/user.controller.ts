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
  Delete,
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
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { 
  CuisinePreferencesResponseDto, 
  AddCuisinePreferenceDto,
  NextMealResponseDto
} from './dto/cuisine-preferences.dto';

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

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile for home screen',
    description: 'Retrieve user subscription status and basic profile information for home screen display.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getCurrentUserProfile(@Request() req: any): Promise<UserProfileResponseDto> {
    const userId = req.user.id;
    return this.userService.getCurrentUserProfile(userId);
  }

  @Get('cuisine-preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user cuisine preferences',
    description: 'Retrieve user cuisine preferences for home screen pill display.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuisine preferences retrieved successfully',
    type: CuisinePreferencesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getCuisinePreferences(@Request() req: any): Promise<CuisinePreferencesResponseDto> {
    const userId = req.user.id;
    return this.userService.getCuisinePreferences(userId);
  }

  @Post('cuisine-preferences')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add cuisine preference',
    description: 'Add a new cuisine preference for the user.',
  })
  @ApiBody({
    type: AddCuisinePreferenceDto,
    description: 'Cuisine preference to add',
  })
  @ApiResponse({
    status: 201,
    description: 'Cuisine preference added successfully',
    type: CuisinePreferencesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid cuisine type or preference already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async addCuisinePreference(
    @Body() addCuisineDto: AddCuisinePreferenceDto,
    @Request() req: any
  ): Promise<CuisinePreferencesResponseDto> {
    const userId = req.user.id;
    return this.userService.addCuisinePreference(userId, addCuisineDto.cuisine);
  }

  @Delete('cuisine-preferences/:cuisine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove cuisine preference',
    description: 'Remove a cuisine preference for the user.',
  })
  @ApiParam({
    name: 'cuisine',
    description: 'Cuisine type to remove',
    example: 'italian',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuisine preference removed successfully',
    type: CuisinePreferencesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async removeCuisinePreference(
    @Param('cuisine') cuisine: string,
    @Request() req: any
  ): Promise<CuisinePreferencesResponseDto> {
    const userId = req.user.id;
    return this.userService.removeCuisinePreference(userId, cuisine);
  }

  @Get('next-meal')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get next meal timing',
    description: 'Get countdown timer information for the next meal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Next meal timing retrieved successfully',
    type: NextMealResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getNextMeal(@Request() req: any): Promise<NextMealResponseDto> {
    return this.userService.getNextMeal();
  }
} 