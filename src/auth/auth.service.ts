import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as appleSignin from 'apple-signin-auth';
import { PrismaService } from '../prisma/prisma.service';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { AuthResponseDto, AuthTokensDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { OtpService } from './otp.service';
import { CreateAccountDto } from './dto/otp-auth.dto';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private subscriptionService: SubscriptionService,
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async signInWithApple(appleAuthDto: AppleAuthDto): Promise<AuthResponseDto> {
    try {
      // Verify Apple ID token
      const applePayload = await appleSignin.verifyIdToken(
        appleAuthDto.identityToken,
        {
          audience: this.configService.get<string>('APPLE_BUNDLE_ID'),
          ignoreExpiration: false,
        },
      );

      const appleId = applePayload.sub;
      const email = applePayload.email || appleAuthDto.email;

      if (!email) {
        throw new BadRequestException('Email is required for Apple sign in');
      }

      // Find existing user by Apple ID
      let user = await this.prisma.user.findUnique({
        where: { appleId },
        include: { profile: true },
      });

      if (!user) {
        // Check if user exists with this email (from Google sign-in)
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.googleId) {
          throw new ConflictException(
            'Account with this email already exists with Google sign in',
          );
        }

        // Extract name information (Apple only provides this on FIRST sign-in)
        let firstName: string | undefined;
        let lastName: string | undefined;
        let fullName: string | undefined;

        // Handle name from the structured name object (preferred)
        if (appleAuthDto.name) {
          firstName = appleAuthDto.name.firstName;
          lastName = appleAuthDto.name.lastName;
          fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;
        }
        // Fallback to fullName string if provided
        else if (appleAuthDto.fullName) {
          fullName = appleAuthDto.fullName;
          // Try to split fullName into first/last if possible
          const nameParts = appleAuthDto.fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          } else if (nameParts.length === 1) {
            firstName = nameParts[0];
          }
        }

        // Create new user with ALL available data from Apple
        user = await this.prisma.user.create({
          data: {
            appleId,
            email,
            emailVerified: true, // Apple provides verified emails
            firstName,
            lastName,
            fullName,
            lastLoginAt: new Date(),
          },
          include: { profile: true },
        });

        console.log(`🍎 New Apple user created: ${user.id} (${email}) - Name: ${fullName || 'Not provided'}`);
      } else {
        // Existing user - just update last login
        // Note: Apple won't provide name/email again, so we don't update those fields
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          include: { profile: true },
        });

        console.log(`🍎 Existing Apple user signed in: ${user.id} (${user.email})`);
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email!);

      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Get user status
      const userStatus = await this.getUserStatus(user.id);

      return {
        tokens,
        user: {
          id: user.id,
          email: user.email!,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          hasCompletedOnboarding: user.profile?.isOnboardingComplete || false,
          lastLoginAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
          ...userStatus,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Apple Sign-In Error:', error);
      throw new UnauthorizedException('Invalid Apple ID token');
    }
  }

  async signInWithGoogle(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    try {
      // Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }

      const googleId = payload.sub;
      const email = payload.email;

      if (!email) {
        throw new BadRequestException('Email is required for Google sign in');
      }

      // Find existing user by Google ID
      let user = await this.prisma.user.findUnique({
        where: { googleId },
        include: { profile: true },
      });

      if (!user) {
        // Check if user exists with this email (from Apple sign-in)
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.appleId) {
          throw new ConflictException(
            'Account with this email already exists with Apple sign in',
          );
        }

        // Extract name information from Google payload
        const firstName = payload.given_name;
        const lastName = payload.family_name;
        const fullName = payload.name;

        // Create new user with ALL available data from Google
        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            emailVerified: payload.email_verified || false,
            firstName,
            lastName,
            fullName,
            lastLoginAt: new Date(),
          },
          include: { profile: true },
        });

        console.log(`🤖 New Google user created: ${user.id} (${email}) - Name: ${fullName || 'Not provided'}`);
      } else {
        // Existing user - just update last login
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          include: { profile: true },
        });

        console.log(`🤖 Existing Google user signed in: ${user.id} (${user.email})`);
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email!);

      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Get user status
      const userStatus = await this.getUserStatus(user.id);

      return {
        tokens,
        user: {
          id: user.id,
          email: user.email!,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          hasCompletedOnboarding: user.profile?.isOnboardingComplete || false,
          lastLoginAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
          ...userStatus,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Google Sign-In Error:', error);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokensDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dysh-refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { 
          id: payload.sub,
          refreshToken,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email!);

      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            location: true,
          },
        },
        deviceInfo: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user status
    const userStatus = await this.getUserStatus(userId);

    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      hasCompletedOnboarding: user.profile?.isOnboardingComplete || false,
      lastLoginAt: user.lastLoginAt,
      profile: user.profile,
      deviceInfo: user.deviceInfo,
      ...userStatus,
    };
  }

  /**
   * Get user status including subscription and recipe generation info
   */
  private async getUserStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check subscription status
    const canGenerate = await this.subscriptionService.canGenerateRecipe(userId);
    
    return {
      freeRecipeUsed: user.freeRecipeUsed,
      recipeGenerationCount: user.recipeGenerationCount,
      subscriptionStatus: {
        hasActiveSubscription: user.subscription?.status === 'ACTIVE',
        plan: user.subscription?.plan || null,
        canGenerateRecipes: canGenerate.canGenerate,
        reason: canGenerate.reason || 'Unknown',
      },
    };
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokensDto> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'dysh-backend-secret-key',
        // No expiration - tokens will not expire
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dysh-refresh-secret',
        // No expiration - tokens will not expire
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 0, // No expiration
    };
  }

  async generateTestToken() {
    try {
      // Check if a test user exists, create if not
      let testUser = await this.prisma.user.findUnique({
        where: { email: 'testuser@example.com' }
      });

      if (!testUser) {
        testUser = await this.prisma.user.create({
          data: {
            email: 'testuser@example.com',
            emailVerified: true,
            firstName: 'Test',
            lastName: 'User',
            fullName: 'Test User',
            isPro: true,
            profile: {
              create: {
                dietaryPreference: 'NONE',
                ingredients: ['chicken', 'rice', 'vegetables'],
                preferredServings: 4,
                onboardingVersion: '1.0',
                isOnboardingComplete: true,
              }
            }
          }
        });
      }

      // Generate tokens
      const tokens = await this.generateTokens(testUser.id, testUser.email!);

      return {
        accessToken: tokens.accessToken,
        message: 'Test token generated successfully',
        userId: testUser.id,
        email: testUser.email,
        expiresIn: 'never'
      };
    } catch (error) {
      console.error('Error generating test token:', error);
      throw new Error('Failed to generate test token');
    }
  }

  // OTP Authentication Methods

  /**
   * Send OTP to user email
   */
  async sendOtp(email: string) {
    const { otp, userExists } = await this.otpService.sendOtp(email);
    
    return {
      message: 'OTP sent successfully',
      email,
      userExists,
    };
  }

  /**
   * Verify OTP and return user status
   */
  async verifyOtp(email: string, otp: string) {
    const { userExists, tempToken } = await this.otpService.verifyOtp(email, otp);
    
    if (userExists) {
      // User exists, log them in
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email!);

      // Update refresh token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Get user status
      const userStatus = await this.getUserStatus(user.id);

      return {
        message: 'OTP verified successfully. User logged in.',
        email,
        userExists: true,
        tokens,
        user: {
          id: user.id,
          email: user.email!,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          hasCompletedOnboarding: user.profile?.isOnboardingComplete || false,
          lastLoginAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
          ...userStatus,
        },
      };
    } else {
      // User doesn't exist, return temp token for account creation
      return {
        message: 'OTP verified successfully. Please provide your name to create account.',
        email,
        userExists: false,
        tempToken,
      };
    }
  }

  /**
   * Create new user account after OTP verification
   */
  async createAccountWithOtp(createAccountDto: CreateAccountDto, tempToken: string) {
    // Verify temp token
    const { email, isValid } = await this.otpService.verifyTempToken(tempToken);
    
    if (!isValid || email !== createAccountDto.email) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAccountDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Generate full name if not provided
    const fullName = createAccountDto.fullName || 
      `${createAccountDto.firstName} ${createAccountDto.lastName}`.trim();

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: createAccountDto.email,
        emailVerified: true, // OTP verification confirms email
        firstName: createAccountDto.firstName,
        lastName: createAccountDto.lastName,
        fullName,
        lastLoginAt: new Date(),
      },
      include: { profile: true },
    });

    console.log(`📧 New OTP user created: ${user.id} (${email}) - Name: ${fullName}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email!);

    // Update refresh token in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Get user status
    const userStatus = await this.getUserStatus(user.id);

    return {
      message: 'Account created successfully',
      tokens,
      user: {
        id: user.id,
        email: user.email!,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        hasCompletedOnboarding: user.profile?.isOnboardingComplete || false,
        lastLoginAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
        ...userStatus,
      },
    };
  }

  /**
   * Test email service connection
   */
  async testEmailService() {
    return this.otpService.testEmailService();
  }
} 