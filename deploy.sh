#!/bin/bash

# Dysh Backend Deployment Script for DigitalOcean
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.${ENVIRONMENT}"

echo "🚀 Starting deployment for ${ENVIRONMENT} environment..."

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "Please create $ENV_FILE with all required environment variables."
    echo "See DEPLOYMENT.md for the complete list."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Pull latest changes (if in git repository)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Update yarn lockfile
echo "📦 Updating dependencies..."
yarn install

# Build and start services
echo "🏗️  Building and starting services..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose -f $COMPOSE_FILE exec app npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker compose -f $COMPOSE_FILE exec app npx prisma generate

# Health check
echo "🏥 Performing health check..."
sleep 5

if curl -f http://localhost:3000/api/docs > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running."
    echo "📚 API Documentation: http://localhost:3000/api/docs"
else
    echo "❌ Health check failed. Checking logs..."
    docker compose -f $COMPOSE_FILE logs app
    exit 1
fi

# Show running services
echo "📊 Running services:"
docker compose -f $COMPOSE_FILE ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop services: docker compose -f $COMPOSE_FILE down"
echo "  Restart: docker compose -f $COMPOSE_FILE restart" 