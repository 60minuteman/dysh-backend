import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplatesService {
  /**
   * Generate OTP email HTML template
   */
  generateOtpEmailHtml(otp: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Dysh OTP Code</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
          }
          .description {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .otp-container {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid #dee2e6;
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            margin: 30px 0;
            position: relative;
          }
          .otp-container::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 12px;
            z-index: -1;
          }
          .otp-code {
            color: #667eea;
            font-size: 42px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 12px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .expiry-warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            text-align: center;
          }
          .expiry-warning p {
            color: #856404;
            font-weight: 600;
            margin: 0;
            font-size: 16px;
          }
          .security-note {
            background-color: #f8f9fa;
            border-left: 4px solid #6c757d;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
          }
          .security-note p {
            color: #6c757d;
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            color: #6c757d;
            margin: 0;
            font-size: 14px;
          }
          .footer .brand {
            color: #667eea;
            font-weight: 600;
          }
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
            margin: 30px 0;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dysh</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello!
            </div>
            
            <div class="description">
              You requested a one-time password (OTP) for your Dysh account. Use the code below to complete your authentication:
            </div>
            
            <div class="otp-container">
              <h1 class="otp-code">${otp}</h1>
            </div>
            
            <div class="expiry-warning">
              <p>⚠️ This code will expire in 10 minutes</p>
            </div>
            
            <div class="security-note">
              <p>
                <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. 
                Never share your OTP with anyone. Dysh will never ask for your OTP via phone or email.
              </p>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>
              Best regards,<br>
              <span class="brand">The Dysh Team</span>
            </p>
            <p style="margin-top: 15px; font-size: 12px;">
              This email was sent to ${email}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate OTP email text template
   */
  generateOtpEmailText(otp: string, email: string): string {
    return `
Dysh - Your OTP Code

Hello!

You requested a one-time password (OTP) for your Dysh account. Use the code below to complete your authentication:

OTP Code: ${otp}

⚠️ This code will expire in 10 minutes.

Security Notice: If you didn't request this code, please ignore this email. Never share your OTP with anyone. Dysh will never ask for your OTP via phone or email.

Best regards,
The Dysh Team

This email was sent to ${email}
    `.trim();
  }

  /**
   * Generate welcome email HTML template (for new users)
   */
  generateWelcomeEmailHtml(userName: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Dysh!</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .description {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .features {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .features h3 {
            color: #333;
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .features ul {
            margin: 0;
            padding-left: 20px;
            color: #666;
          }
          .features li {
            margin-bottom: 8px;
            line-height: 1.5;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            color: #6c757d;
            margin: 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Dysh!</h1>
          </div>
          
          <div class="content">
            <div class="welcome-message">
              Welcome, ${userName}! 🎉
            </div>
            
            <div class="description">
              Thank you for joining Dysh! We're excited to help you discover amazing recipes and create delicious meals.
            </div>
            
            <div class="features">
              <h3>What you can do with Dysh:</h3>
              <ul>
                <li>Discover personalized recipes based on your preferences</li>
                <li>Get daily recipe recommendations</li>
                <li>Save your favorite recipes to your cookbook</li>
                <li>Explore recipes by cuisine and dietary preferences</li>
                <li>Get cooking tips and techniques</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">Start Exploring Recipes</a>
            </div>
          </div>
          
          <div class="footer">
            <p>
              Happy cooking!<br>
              <strong>The Dysh Team</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
