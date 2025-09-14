#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SwiftCourier Backend...${NC}"

# Function to parse DATABASE_URL and extract host/port
parse_database_url() {
    if [ -n "$DATABASE_URL" ]; then
        # Extract host from DATABASE_URL
        # Format: postgresql://username:password@host:port/database
        DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*://.*:.*@\([^:]*\):\([^/]*\)/.*|\1|p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*://.*:.*@\([^:]*\):\([^/]*\)/.*|\2|p')
        
        # If port is not found in URL, use default PostgreSQL port
        if [ -z "$DB_PORT" ]; then
            DB_PORT="5432"
        fi
        
        echo -e "${GREEN}📊 Parsed database connection: ${DB_HOST}:${DB_PORT}${NC}"
    else
        # Fallback to individual environment variables
        DB_HOST=${DB_HOST:-localhost}
        DB_PORT=${DB_PORT:-5432}
        echo -e "${YELLOW}⚠️  Using fallback database connection: ${DB_HOST}:${DB_PORT}${NC}"
    fi
}

# Function to wait for database
wait_for_db() {
    echo -e "${YELLOW}⏳ Waiting for database connection...${NC}"
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z $DB_HOST $DB_PORT 2>/dev/null; then
            echo -e "${GREEN}✅ Database connection established${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - Database not ready, waiting...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Failed to connect to database after $max_attempts attempts${NC}"
    return 1
}

# Parse database URL first
parse_database_url

# Wait for database
wait_for_db

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
python manage.py migrate --verbosity=1

# Create superuser if environment variables are provided
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo -e "${YELLOW}👤 Creating superuser...${NC}"
    python manage.py createsuperuser \
        --username "$DJANGO_SUPERUSER_USERNAME" \
        --email "$DJANGO_SUPERUSER_EMAIL" \
        --noinput || echo -e "${GREEN}ℹ️  Superuser may already exist${NC}"
else
    # Fallback: Create default superuser
    echo -e "${YELLOW}👤 Creating default superuser (admin/admin123)...${NC}"
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@swiftcourier.com', 'admin123')
    print('✅ Superuser created successfully')
else:
    print('ℹ️  Superuser already exists')
EOF
fi

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --verbosity=0

# Create log files
touch /app/logs/django.log /app/logs/security.log

# Set proper permissions for logs
chmod 644 /app/logs/*.log 2>/dev/null || true

# Run database optimizations (if the command exists)
if python manage.py | grep -q "optimize_database"; then
    echo -e "${YELLOW}⚡ Running database optimizations...${NC}"
    python manage.py optimize_database || echo -e "${YELLOW}⚠️  Database optimization command not available${NC}"
fi

echo -e "${GREEN}🎉 SwiftCourier Backend is ready!${NC}"

# Execute the main command with PORT support
if [ "$1" = "runserver" ]; then
    echo -e "${GREEN}🌐 Starting Django development server...${NC}"
    exec python manage.py runserver 0.0.0.0:$PORT
elif [ "$1" = "daphne" ]; then
    echo -e "${GREEN}⚡ Starting Daphne ASGI server...${NC}"
    exec daphne -b 0.0.0.0 -p $PORT swiftcourier_backend.asgi:application
elif [ "$1" = "gunicorn" ]; then
    echo -e "${GREEN}🐴 Starting Gunicorn WSGI server...${NC}"
    exec gunicorn swiftcourier_backend.wsgi:application \
        --bind 0.0.0.0:$PORT \
        --workers 2 \
        --threads 4 \
        --worker-class gthread \
        --max-requests 1000 \
        --max-requests-jitter 50 \
        --timeout 30 \
        --keep-alive 10 \
        --log-level info \
        --access-logfile - \
        --error-logfile -
elif [ "$1" = "celery" ]; then
    echo -e "${GREEN}🥕 Starting Celery worker...${NC}"
    exec celery -A swiftcourier_backend worker --loglevel=info --concurrency=2
elif [ "$1" = "celery-beat" ]; then
    echo -e "${GREEN}⏰ Starting Celery beat...${NC}"
    exec celery -A swiftcourier_backend beat --loglevel=info
else
    echo -e "${GREEN}▶️  Executing: $@${NC}"
    exec "$@"
fi
