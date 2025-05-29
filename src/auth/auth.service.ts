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

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

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
    };
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokensDto> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
    };

    const accessTokenExpiresIn = '15m';
    const refreshTokenExpiresIn = '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'dysh-backend-secret-key',
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'dysh-refresh-secret',
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
} 