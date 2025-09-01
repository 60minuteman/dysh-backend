import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';
import { EmailTemplatesService } from '../common/services/email-templates.service';

@Injectable()
export class OtpService {
  private resend: Resend;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private emailTemplatesService: EmailTemplatesService,
  ) {
    // Initialize Resend email client
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY not found in environment variables. Email sending will be disabled.');
    } else {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend email client initialized successfully');
    }
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to user email
   * For now, we'll just store it in the database
   * In production, you'd integrate with an email service like SendGrid, AWS SES, etc.
   */
  async sendOtp(email: string): Promise<{ otp: string; userExists: boolean }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const userExists = !!existingUser;

    // Generate OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await this.prisma.otpVerification.upsert({
      where: { email },
      update: {
        otp,
        expiresAt,
        attempts: 0,
      },
      create: {
        email,
        otp,
        expiresAt,
        attempts: 0,
      },
    });

    // Send email via Resend
    if (this.resend) {
      try {
        const emailResult = await this.resend.emails.send({
          from: 'Dysh <noreply@dailydysh.com>',
          to: [email],
          subject: 'Your Dysh OTP Code',
          html: this.emailTemplatesService.generateOtpEmailHtml(otp, email),
          text: this.emailTemplatesService.generateOtpEmailText(otp, email),
        });

        if (emailResult.error) {
          console.error('❌ Resend API Error:', emailResult.error);
          console.log(`📧 Fallback: OTP sent to ${email}: ${otp} (expires in 10 minutes)`);
        } else {
          console.log(`📧 OTP email sent successfully to ${email} (ID: ${emailResult.data?.id})`);
        }
      } catch (error) {
        console.error('❌ Failed to send OTP email via Resend:', error);
        console.log(`📧 Fallback: OTP sent to ${email}: ${otp} (expires in 10 minutes)`);
      }
    } else {
      console.log(`📧 Resend not configured. OTP sent to ${email}: ${otp} (expires in 10 minutes)`);
    }

    return { otp, userExists };
  }

  /**
   * Verify OTP and return user status
   */
  async verifyOtp(email: string, otp: string): Promise<{ userExists: boolean; tempToken?: string }> {
    // Find OTP record
    const otpRecord = await this.prisma.otpVerification.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found. Please request a new OTP.');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      // Clean up expired OTP
      await this.prisma.otpVerification.delete({
        where: { email },
      });
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 3) {
      // Clean up OTP after too many attempts
      await this.prisma.otpVerification.delete({
        where: { email },
      });
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await this.prisma.otpVerification.update({
        where: { email },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new BadRequestException('Invalid OTP.');
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const userExists = !!existingUser;

    // Clean up OTP after successful verification
    await this.prisma.otpVerification.delete({
      where: { email },
    });

    // If user doesn't exist, generate temporary token for account creation
    let tempToken: string | undefined;
    if (!userExists) {
      tempToken = this.jwtService.sign(
        { email, type: 'otp_verification' },
        { 
          secret: this.configService.get<string>('JWT_SECRET') || 'dysh-backend-secret-key',
          expiresIn: '15m' // 15 minutes to complete account creation
        }
      );
    }

    return { userExists, tempToken };
  }

  /**
   * Verify temporary token for account creation
   */
  async verifyTempToken(tempToken: string): Promise<{ email: string; isValid: boolean }> {
    try {
      const payload = this.jwtService.verify(tempToken, {
        secret: this.configService.get<string>('JWT_SECRET') || 'dysh-backend-secret-key',
      });

      if (payload.type !== 'otp_verification') {
        return { email: '', isValid: false };
      }

      return { email: payload.email, isValid: true };
    } catch (error) {
      return { email: '', isValid: false };
    }
  }

  /**
   * Clean up expired OTPs (can be called by a cron job)
   */
  async cleanupExpiredOtps(): Promise<void> {
    await this.prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Test Resend email service connection
   */
  async testEmailService(): Promise<{ success: boolean; message: string }> {
    if (!this.resend) {
      return {
        success: false,
        message: 'Resend client not initialized. Check RESEND_API_KEY environment variable.'
      };
    }

    try {
      // Send a test email to verify the service works
      const testResult = await this.resend.emails.send({
        from: 'Dysh <noreply@dailydysh.com>',
        to: ['test@example.com'],
        subject: 'Dysh Email Service Test',
        html: this.emailTemplatesService.generateOtpEmailHtml('123456', 'test@example.com'),
        text: this.emailTemplatesService.generateOtpEmailText('123456', 'test@example.com'),
      });

      if (testResult.error) {
        return {
          success: false,
          message: `Resend API Error: ${testResult.error.message}`
        };
      }

      return {
        success: true,
        message: `Email service is working. Test email ID: ${testResult.data?.id}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to test email service: ${error.message}`
      };
    }
  }
}
