#!/bin/bash

# SwiftCourier Production Deployment Script

set -e

echo "🚀 Starting SwiftCourier deployment..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod file not found. Please create it with production environment variables."
    exit 1
fi

# Load environment variables
export $(cat .env.prod | xargs)

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Create superuser if needed
echo "👤 Creating superuser..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@swiftcourier.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
EOF

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: https://${ALLOWED_HOSTS%%,*}"
echo "🔧 Admin panel: https://${ALLOWED_HOSTS%%,*}/admin/"
