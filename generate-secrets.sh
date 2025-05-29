#!/bin/bash

# Generate secure secrets for production deployment
echo "🔐 Generating secure secrets for production deployment..."
echo ""

# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Generate database password
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

echo "Copy these values to your .env.production file:"
echo "================================================"
echo ""
echo "# Database Configuration"
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo "DATABASE_URL=postgresql://dysh_user:$DB_PASSWORD@db:5432/dysh_db?schema=public"
echo ""
echo "# JWT Configuration"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "================================================"
echo ""
echo "⚠️  IMPORTANT: Store these secrets securely!"
echo "   - Never commit them to version control"
echo "   - Use different secrets for each environment"
echo "   - Keep them in a secure password manager" 