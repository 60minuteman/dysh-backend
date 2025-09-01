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
import { SendOtpDto, VerifyOtpDto, CreateAccountDto } from './dto/otp-auth.dto';
import { OtpResponseDto, OtpVerificationResponseDto } from './dto/otp-response.dto';

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

  @Post('test-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate test token (Development only)',
    description: 'Generate a test JWT token for development and testing purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test token generated successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        message: { type: 'string', example: 'Test token generated' },
        userId: { type: 'string', example: 'test-user-id' },
        expiresIn: { type: 'string', example: '24h' },
      },
    },
  })
  async generateTestToken() {
    // Only allow in development/staging
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Test tokens not available in production' };
    }
    
    return this.authService.generateTestToken();
  }

  // OTP Authentication Endpoints

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send OTP to email',
    description: 'Send a one-time password to the user\'s email address for authentication.',
  })
  @ApiBody({
    type: SendOtpDto,
    examples: {
      sendOtp: {
        summary: 'Send OTP request',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: OtpResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email address',
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<OtpResponseDto> {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify the OTP sent to user\'s email. If user exists, they are logged in. If not, a temporary token is returned for account creation.',
  })
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      verifyOtp: {
        summary: 'Verify OTP request',
        value: {
          email: 'user@example.com',
          otp: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: OtpVerificationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP, expired OTP, or too many attempts',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new account with OTP verification',
    description: 'Create a new user account after OTP verification. Requires the temporary token from verify-otp endpoint.',
  })
  @ApiBody({
    type: CreateAccountDto,
    examples: {
      createAccount: {
        summary: 'Create account request',
        value: {
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid verification token or missing required fields',
  })
  @ApiConflictResponse({
    description: 'User already exists with this email',
  })
  async createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.authService.createAccountWithOtp(createAccountDto, createAccountDto.tempToken);
  }

  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test email service (Development only)',
    description: 'Test the Resend email service connection and configuration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email service test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email service is working' },
      },
    },
  })
  async testEmailService() {
    // Only allow in development/staging
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Email testing not available in production' };
    }
    
    return this.authService.testEmailService();
  }
} 