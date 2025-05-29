import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthResponseDto, RefreshTokenDto, AuthTokensDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Apple',
    description: 'Authenticate user using Apple ID token from iOS app. Creates a new user if they don\'t exist.',
  })
  @ApiBody({
    type: AppleAuthDto,
    examples: {
      firstSignIn: {
        summary: 'First time sign in (with name)',
        description: 'First sign in includes email and structured name object',
        value: {
          identityToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
          email: 'user@privaterelay.appleid.com',
          name: {
            firstName: 'John',
            lastName: 'Doe'
          }
        },
      },
      firstSignInLegacy: {
        summary: 'First time sign in (legacy fullName)',
        description: 'Alternative format with fullName string',
        value: {
          identityToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
          email: 'user@privaterelay.appleid.com',
          fullName: 'John Doe',
        },
      },
      returningUser: {
        summary: 'Returning user',
        description: 'Subsequent sign ins only include the identity token (no email/name)',
        value: {
          identityToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid Apple ID token or missing email',
  })
  @ApiConflictResponse({
    description: 'Email already exists with Google sign in',
  })
  async signInWithApple(@Body() appleAuthDto: AppleAuthDto): Promise<AuthResponseDto> {
    return this.authService.signInWithApple(appleAuthDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with Google',
    description: 'Authenticate user using Google ID token from Android app. Creates a new user if they don\'t exist.',
  })
  @ApiBody({
    type: GoogleAuthDto,
    examples: {
      android: {
        summary: 'Google sign in from Android',
        value: {
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyN...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid Google ID token',
  })
  @ApiConflictResponse({
    description: 'Email already exists with Apple sign in',
  })
  async signInWithGoogle(@Body() googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    return this.authService.signInWithGoogle(googleAuthDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      refresh: {
        summary: 'Refresh token request',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthTokensDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user\'s profile information including onboarding status.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clp123abc456def789' },
        email: { type: 'string', example: 'user@example.com' },
        emailVerified: { type: 'boolean', example: true },
        hasCompletedOnboarding: { type: 'boolean', example: false },
        lastLoginAt: { type: 'string', format: 'date-time' },
        profile: {
          type: 'object',
          nullable: true,
          description: 'User profile data if onboarding completed',
        },
        deviceInfo: {
          type: 'array',
          items: { type: 'object' },
          description: 'User device information',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing JWT token',
  })
  async getCurrentUser(@Request() req: any) {
    return this.authService.getCurrentUser(req.user.id);
  }
} 